import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { apiPost } from '@/lib/api'

export async function GET() {
	const cookieStore = await cookies()
	const refreshToken = cookieStore.get('refresh_token')?.value

	if (refreshToken) {
		await apiPost('/api/v1/auth/logout', { refreshToken }).catch(() => {})
	}

	cookieStore.delete('access_token')
	cookieStore.delete('refresh_token')

	return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3001'))
}
