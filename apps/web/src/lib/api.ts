const API_URL = process.env.API_URL || 'http://localhost:3000'

export async function apiPost<T>(
	path: string,
	body: unknown,
): Promise<{ data?: T; error?: { code: string; message: string } }> {
	const res = await fetch(`${API_URL}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	const json = await res.json()

	if (!res.ok) {
		return { error: json.error }
	}

	return { data: json.data }
}
