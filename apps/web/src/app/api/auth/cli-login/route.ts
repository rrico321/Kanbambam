import { NextRequest, NextResponse } from 'next/server'
import { LoginSchema } from '@kanbambam/shared'
import { serverPost } from '@/lib/api-server'

export async function POST(request: NextRequest) {
	const formData = await request.formData()
	const email = formData.get('email') as string
	const password = formData.get('password') as string
	const cliCallback = formData.get('cli_callback') as string
	const state = formData.get('state') as string

	if (!cliCallback || !state) {
		return NextResponse.json({ error: 'Missing CLI callback parameters' }, { status: 400 })
	}

	const parsed = LoginSchema.safeParse({ email, password })
	if (!parsed.success) {
		const params = new URLSearchParams({
			cli_callback: cliCallback,
			state,
			error: 'Invalid email or password',
		})
		return NextResponse.redirect(new URL(`/auth/login?${params}`, request.url))
	}

	const result = await serverPost<{ accessToken: string; refreshToken: string }>(
		'/api/v1/auth/login',
		{ email, password },
	)

	if (result.error) {
		const errorMsg = result.error.code === 'INVALID_CREDENTIALS'
			? 'Invalid email or password'
			: 'Unable to reach server'
		const params = new URLSearchParams({
			cli_callback: cliCallback,
			state,
			error: errorMsg,
		})
		return NextResponse.redirect(new URL(`/auth/login?${params}`, request.url))
	}

	const { accessToken, refreshToken } = result.data!
	const callbackUrl = new URL(cliCallback)
	callbackUrl.searchParams.set('access_token', accessToken)
	callbackUrl.searchParams.set('refresh_token', refreshToken)
	callbackUrl.searchParams.set('state', state)

	return NextResponse.redirect(callbackUrl.toString())
}
