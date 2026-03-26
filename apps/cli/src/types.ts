export interface GlobalOptions {
	json?: boolean
}

export interface AuthTokens {
	accessToken: string
	refreshToken: string
}

export interface ApiEnvelope<T> {
	data: T
	meta: Record<string, unknown>
}

export interface ApiError {
	error: {
		code: string
		message: string
		details?: Record<string, unknown>
	}
}
