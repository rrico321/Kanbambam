const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type ApiError = { code: string; message: string }
type ApiResult<T> = { data?: T; error?: ApiError }

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshToken(): Promise<boolean> {
	try {
		const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
		})
		return res.ok
	} catch {
		return false
	}
}

async function apiFetch<T>(
	path: string,
	options: RequestInit = {},
	_isRetry = false,
): Promise<ApiResult<T>> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		credentials: 'include',
	})

	// 401 retry: attempt token refresh once, then retry the original request
	if (res.status === 401 && !_isRetry) {
		if (!isRefreshing) {
			isRefreshing = true
			refreshPromise = refreshToken().finally(() => {
				isRefreshing = false
			})
		}
		const refreshed = await refreshPromise
		if (refreshed) {
			return apiFetch<T>(path, options, true)
		}
		// Refresh failed -- redirect to login
		if (typeof window !== 'undefined') {
			window.location.href = '/auth/login'
		}
		return { error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
	}

	if (res.status === 204) return { data: undefined as T }

	const json = await res.json()
	if (!res.ok) return { error: json.error }
	return { data: json.data }
}

// Server-side POST helper for server actions (uses API_URL without NEXT_PUBLIC_ prefix)
const SERVER_API_URL = process.env.API_URL || API_URL

export async function apiPost<T>(
	path: string,
	body: unknown,
): Promise<ApiResult<T>> {
	const res = await fetch(`${SERVER_API_URL}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	const json = await res.json()
	if (!res.ok) return { error: json.error }
	return { data: json.data }
}

export const api = {
	get: <T>(path: string) => apiFetch<T>(path),
	post: <T>(path: string, body?: unknown) =>
		apiFetch<T>(path, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined,
		}),
	patch: <T>(path: string, body: unknown) =>
		apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
