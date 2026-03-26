import { createRoute, z } from '@hono/zod-openapi'
import {
	ItemSchema,
	CreateItemSchema,
	UpdateItemSchema,
	MoveItemSchema,
	envelopeSchema,
	paginatedSchema,
	PaginationQuerySchema,
	ErrorResponseSchema,
} from '@kanbambam/shared'

export const listItemsRoute = createRoute({
	method: 'get',
	path: '/api/v1/columns/{columnId}/items',
	tags: ['Items'],
	summary: 'List items in a column',
	request: {
		params: z.object({ columnId: z.string() }),
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: paginatedSchema(ItemSchema),
				},
			},
			description: 'List of items',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Column not found',
		},
	},
})

export const createItemRoute = createRoute({
	method: 'post',
	path: '/api/v1/columns/{columnId}/items',
	tags: ['Items'],
	summary: 'Create an item in a column',
	request: {
		params: z.object({ columnId: z.string() }),
		body: {
			content: {
				'application/json': { schema: CreateItemSchema },
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: envelopeSchema(ItemSchema),
				},
			},
			description: 'Item created',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Column not found',
		},
	},
})

export const getItemRoute = createRoute({
	method: 'get',
	path: '/api/v1/items/{id}',
	tags: ['Items'],
	summary: 'Get a single item',
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(ItemSchema),
				},
			},
			description: 'Item details',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Item not found',
		},
	},
})

export const updateItemRoute = createRoute({
	method: 'patch',
	path: '/api/v1/items/{id}',
	tags: ['Items'],
	summary: 'Update an item',
	request: {
		params: z.object({ id: z.string() }),
		body: {
			content: {
				'application/json': { schema: UpdateItemSchema },
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(ItemSchema),
				},
			},
			description: 'Item updated',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Item not found',
		},
	},
})

export const deleteItemRoute = createRoute({
	method: 'delete',
	path: '/api/v1/items/{id}',
	tags: ['Items'],
	summary: 'Delete an item',
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		204: {
			description: 'Item deleted',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Item not found',
		},
	},
})

export const moveItemRoute = createRoute({
	method: 'post',
	path: '/api/v1/items/{id}/move',
	tags: ['Items'],
	summary: 'Move an item to a different column or position',
	request: {
		params: z.object({ id: z.string() }),
		body: {
			content: {
				'application/json': { schema: MoveItemSchema },
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(ItemSchema),
				},
			},
			description: 'Item moved',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Item or target column not found',
		},
	},
})
