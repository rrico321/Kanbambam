'use server'
import { redirect } from 'next/navigation'
import { LoginSchema } from '@kanbambam/shared'
import { serverPost } from '@/lib/api-server'
import { setAuthCookies } from '@/lib/auth'

export interface LoginState {
	error?: string
	fieldErrors?: Record<string, string>
	cliRedirect?: string
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
	const email = formData.get('email') as string
	const password = formData.get('password') as string
	const cliCallback = formData.get('cli_callback') as string | null
	const state = formData.get('state') as string | null

	const parsed = LoginSchema.safeParse({ email, password })
	if (!parsed.success) {
		const fieldErrors: Record<string, string> = {}
		for (const issue of parsed.error.issues) {
			if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
		}
		return { fieldErrors }
	}

	const result = await serverPost<{ accessToken: string; refreshToken: string }>(
		'/api/v1/auth/login',
		{ email, password },
	)

	if (result.error) {
		if (result.error.code === 'INVALID_CREDENTIALS') {
			return { error: 'Invalid email or password. Please try again.' }
		}
		return { error: 'Unable to reach server. Check your connection and try again.' }
	}

	const { accessToken, refreshToken } = result.data!

	if (cliCallback && state) {
		const callbackUrl = new URL(cliCallback)
		callbackUrl.searchParams.set('access_token', accessToken)
		callbackUrl.searchParams.set('refresh_token', refreshToken)
		callbackUrl.searchParams.set('state', state)
		return { cliRedirect: callbackUrl.toString() }
	}

	await setAuthCookies(accessToken, refreshToken)
	redirect('/')
}
