import { redirect } from 'next/navigation'
import { apiPost } from '@/lib/api'
import { clearAuthCookies, getRefreshToken } from '@/lib/auth'

export default async function LogoutPage() {
	const refreshToken = await getRefreshToken()

	if (refreshToken) {
		await apiPost('/api/v1/auth/logout', { refreshToken }).catch(() => {})
	}

	await clearAuthCookies()
	redirect('/auth/login')
}
