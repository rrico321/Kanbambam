'use server'
import { redirect } from 'next/navigation'
import { CreateUserSchema } from '@kanbambam/shared'
import { serverPost } from '@/lib/api-server'
import { setAuthCookies } from '@/lib/auth'

export interface SignupState {
	error?: string
	fieldErrors?: Record<string, string>
}

export async function signupAction(
	prevState: SignupState,
	formData: FormData,
): Promise<SignupState> {
	const email = formData.get('email') as string
	const password = formData.get('password') as string
	const confirmPassword = formData.get('confirmPassword') as string

	if (password !== confirmPassword) {
		return { fieldErrors: { confirmPassword: 'Passwords do not match.' } }
	}

	const parsed = CreateUserSchema.safeParse({ email, password })
	if (!parsed.success) {
		const fieldErrors: Record<string, string> = {}
		for (const issue of parsed.error.issues) {
			const field = issue.path[0] as string
			if (field === 'password' && issue.code === 'too_small') {
				fieldErrors[field] = 'Password must be at least 8 characters.'
			} else {
				fieldErrors[field] = issue.message
			}
		}
		return { fieldErrors }
	}

	const result = await serverPost<{ accessToken: string; refreshToken: string }>(
		'/api/v1/auth/signup',
		{ email, password },
	)

	if (result.error) {
		if (result.error.code === 'DUPLICATE_EMAIL') {
			return { error: 'An account with this email already exists.' }
		}
		return { error: 'Unable to reach server. Check your connection and try again.' }
	}

	await setAuthCookies(result.data!.accessToken, result.data!.refreshToken)
	redirect('/')
}
