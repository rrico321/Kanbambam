import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST() {
	const cookieStore = await cookies()
	const refreshToken = cookieStore.get('refresh_token')?.value

	if (!refreshToken) {
		return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
	}

	const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken }),
	})

	if (!res.ok) {
		// Clear stale cookies on refresh failure
		cookieStore.delete('access_token')
		cookieStore.delete('refresh_token')
		return NextResponse.json({ error: 'Refresh failed' }, { status: 401 })
	}

	const json = await res.json()
	const { accessToken, refreshToken: newRefresh } = json.data

	cookieStore.set('access_token', accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 15 * 60,
		path: '/',
	})

	cookieStore.set('refresh_token', newRefresh, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60,
		path: '/',
	})

	return NextResponse.json({ ok: true })
}
