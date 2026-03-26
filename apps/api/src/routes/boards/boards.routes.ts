import { createRoute, z } from '@hono/zod-openapi'
import {
	BoardSchema,
	CreateBoardSchema,
	UpdateBoardSchema,
	PaginationQuerySchema,
	envelopeSchema,
	paginatedSchema,
	ErrorResponseSchema,
} from '@kanbambam/shared'

export const listBoardsRoute = createRoute({
	method: 'get',
	path: '/api/v1/workspaces/{workspaceId}/boards',
	tags: ['Boards'],
	summary: 'List boards in a workspace',
	request: {
		params: z.object({
			workspaceId: z.string().startsWith('wks_'),
		}),
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: paginatedSchema(BoardSchema),
				},
			},
			description: 'List of boards',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Workspace not found',
		},
	},
})

export const createBoardRoute = createRoute({
	method: 'post',
	path: '/api/v1/workspaces/{workspaceId}/boards',
	tags: ['Boards'],
	summary: 'Create a new board in a workspace',
	request: {
		params: z.object({
			workspaceId: z.string().startsWith('wks_'),
		}),
		body: {
			content: {
				'application/json': {
					schema: CreateBoardSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: envelopeSchema(BoardSchema),
				},
			},
			description: 'Board created',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Invalid input',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Workspace not found',
		},
	},
})

export const getBoardRoute = createRoute({
	method: 'get',
	path: '/api/v1/boards/{id}',
	tags: ['Boards'],
	summary: 'Get a single board',
	request: {
		params: z.object({
			id: z.string().startsWith('brd_'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(BoardSchema),
				},
			},
			description: 'Board found',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Board not found',
		},
	},
})

export const updateBoardRoute = createRoute({
	method: 'patch',
	path: '/api/v1/boards/{id}',
	tags: ['Boards'],
	summary: 'Update a board',
	request: {
		params: z.object({
			id: z.string().startsWith('brd_'),
		}),
		body: {
			content: {
				'application/json': {
					schema: UpdateBoardSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(BoardSchema),
				},
			},
			description: 'Board updated',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Board not found',
		},
	},
})

export const deleteBoardRoute = createRoute({
	method: 'delete',
	path: '/api/v1/boards/{id}',
	tags: ['Boards'],
	summary: 'Delete a board',
	request: {
		params: z.object({
			id: z.string().startsWith('brd_'),
		}),
	},
	responses: {
		204: {
			description: 'Board deleted',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Board not found',
		},
	},
})
