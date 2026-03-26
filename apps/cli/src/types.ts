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

export interface WorkspaceResponse {
	id: string
	name: string
	userId: string
	createdAt: string
	updatedAt: string
}

export interface BoardResponse {
	id: string
	name: string
	workspaceId: string
	createdAt: string
	updatedAt: string
}

export interface ColumnResponse {
	id: string
	name: string
	boardId: string
	position: string
	createdAt: string
	updatedAt: string
}

export interface ItemResponse {
	id: string
	title: string
	description: string | null
	columnId: string
	position: string
	dueDate: string | null
	labels: string[] | null
	createdAt: string
	updatedAt: string
}

export interface PaginatedMeta {
	total: number
	cursor: string | null
}
