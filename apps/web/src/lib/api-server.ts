const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type ApiError = { code: string; message: string }
type ApiResult<T> = { data?: T; error?: ApiError }

export async function serverPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
	try {
		const res = await fetch(`${API_URL}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})

		if (res.status === 204) return { data: undefined as T }

		const json = await res.json()
		if (!res.ok) return { error: json.error || { code: 'UNKNOWN', message: 'Request failed' } }
		return { data: json.data }
	} catch {
		return { error: { code: 'NETWORK_ERROR', message: 'Unable to reach server' } }
	}
}
