const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function resolveUrl(path: string): string {
	// Server-side: need full URL (relative paths don't work in Node.js fetch)
	if (typeof window === 'undefined') {
		return `${API_URL}${path}`
	}
	// Client-side: use relative path (goes through Next.js rewrites)
	return path
}

type ApiError = { code: string; message: string }
type ApiResult<T> = { data?: T; error?: ApiError }

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshToken(): Promise<boolean> {
	try {
		const res = await fetch('/api/auth/refresh', {
			method: 'POST',
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
	const res = await fetch(resolveUrl(path), {
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
	if (!res.ok) return { error: json.error || { code: 'UNKNOWN', message: 'Request failed' } }
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

// Legacy export for existing code
export async function apiPost<T>(
	path: string,
	body: unknown,
): Promise<ApiResult<T>> {
	return api.post<T>(path, body)
}
