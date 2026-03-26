import { createRoute, z } from '@hono/zod-openapi'
import {
	ColumnSchema,
	CreateColumnSchema,
	UpdateColumnSchema,
	envelopeSchema,
	paginatedSchema,
	PaginationQuerySchema,
	ErrorResponseSchema,
} from '@kanbambam/shared'

export const listColumnsRoute = createRoute({
	method: 'get',
	path: '/api/v1/boards/{boardId}/columns',
	tags: ['Columns'],
	summary: 'List columns for a board',
	request: {
		params: z.object({ boardId: z.string() }),
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: paginatedSchema(ColumnSchema),
				},
			},
			description: 'List of columns',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Board not found',
		},
	},
})

export const createColumnRoute = createRoute({
	method: 'post',
	path: '/api/v1/boards/{boardId}/columns',
	tags: ['Columns'],
	summary: 'Create a column in a board',
	request: {
		params: z.object({ boardId: z.string() }),
		body: {
			content: {
				'application/json': { schema: CreateColumnSchema },
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: envelopeSchema(ColumnSchema),
				},
			},
			description: 'Column created',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Board not found',
		},
	},
})

export const getColumnRoute = createRoute({
	method: 'get',
	path: '/api/v1/columns/{id}',
	tags: ['Columns'],
	summary: 'Get a single column',
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(ColumnSchema),
				},
			},
			description: 'Column details',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Column not found',
		},
	},
})

export const updateColumnRoute = createRoute({
	method: 'patch',
	path: '/api/v1/columns/{id}',
	tags: ['Columns'],
	summary: 'Update a column',
	request: {
		params: z.object({ id: z.string() }),
		body: {
			content: {
				'application/json': { schema: UpdateColumnSchema },
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(ColumnSchema),
				},
			},
			description: 'Column updated',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Column not found',
		},
	},
})

export const deleteColumnRoute = createRoute({
	method: 'delete',
	path: '/api/v1/columns/{id}',
	tags: ['Columns'],
	summary: 'Delete a column',
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		204: {
			description: 'Column deleted',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Column not found',
		},
	},
})
