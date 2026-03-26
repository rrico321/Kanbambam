import { clearTokens, config } from './config.js'

export async function apiRequest(path: string, options?: RequestInit): Promise<Response> {
	const accessToken = config.get('accessToken')
	if (!accessToken) {
		throw new Error('Not authenticated. Run: kanbambam auth login')
	}

	const apiBaseUrl = config.get('apiBaseUrl')
	const headers = new Headers(options?.headers)
	headers.set('Authorization', `Bearer ${accessToken}`)
	headers.set('Content-Type', 'application/json')

	const response = await fetch(`${apiBaseUrl}${path}`, {
		...options,
		headers,
	})

	if (response.status === 401) {
		const refreshToken = config.get('refreshToken')
		if (!refreshToken) {
			clearTokens()
			throw new Error('Session expired. Run: kanbambam auth login')
		}

		const refreshResponse = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		})

		if (!refreshResponse.ok) {
			clearTokens()
			throw new Error('Session expired. Run: kanbambam auth login')
		}

		const refreshData = (await refreshResponse.json()) as {
			data: { accessToken: string; refreshToken: string }
		}
		config.set('accessToken', refreshData.data.accessToken)
		config.set('refreshToken', refreshData.data.refreshToken)

		// Retry original request with new token
		const retryHeaders = new Headers(options?.headers)
		retryHeaders.set('Authorization', `Bearer ${refreshData.data.accessToken}`)
		retryHeaders.set('Content-Type', 'application/json')

		return fetch(`${apiBaseUrl}${path}`, {
			...options,
			headers: retryHeaders,
		})
	}

	return response
}
