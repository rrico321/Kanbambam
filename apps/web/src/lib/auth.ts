'use server'
import { cookies } from 'next/headers'

export async function setAuthCookies(accessToken: string, refreshToken: string) {
	const cookieStore = await cookies()

	cookieStore.set('access_token', accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 15 * 60,
		path: '/',
	})

	cookieStore.set('refresh_token', refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60,
		path: '/',
	})
}

export async function clearAuthCookies() {
	const cookieStore = await cookies()
	cookieStore.delete('access_token')
	cookieStore.delete('refresh_token')
}

export async function getRefreshToken(): Promise<string | undefined> {
	const cookieStore = await cookies()
	return cookieStore.get('refresh_token')?.value
}
