type ApiResult<T> = { data?: T; error?: { code: string; message: string } }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function request<T>(
	path: string,
	options: RequestInit = {},
): Promise<ApiResult<T>> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	})

	if (res.status === 204) {
		return { data: undefined as T }
	}

	const json = await res.json()

	if (!res.ok) {
		return { error: json.error || { code: 'UNKNOWN', message: 'Request failed' } }
	}

	return { data: json.data }
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
	patch: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Legacy export for existing code
export async function apiPost<T>(
	path: string,
	body: unknown,
): Promise<ApiResult<T>> {
	return api.post<T>(path, body)
}
