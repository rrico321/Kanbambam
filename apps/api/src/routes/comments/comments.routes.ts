import { createRoute, z } from '@hono/zod-openapi'
import {
	CommentSchema,
	CreateCommentSchema,
	ErrorResponseSchema,
	envelopeSchema,
	PaginationQuerySchema,
	paginatedSchema,
	UpdateCommentSchema,
} from '@kanbambam/shared'

export const listCommentsRoute = createRoute({
	method: 'get',
	path: '/api/v1/items/{id}/comments',
	tags: ['Comments'],
	summary: 'List comments on an item (oldest first)',
	request: {
		params: z.object({ id: z.string() }),
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { 'application/json': { schema: paginatedSchema(CommentSchema) } },
			description: 'List of comments',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Item not found',
		},
	},
})

export const createCommentRoute = createRoute({
	method: 'post',
	path: '/api/v1/items/{id}/comments',
	tags: ['Comments'],
	summary: 'Add a comment to an item',
	request: {
		params: z.object({ id: z.string() }),
		body: {
			content: { 'application/json': { schema: CreateCommentSchema } },
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: envelopeSchema(CommentSchema) } },
			description: 'Comment created',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Item not found',
		},
	},
})

export const updateCommentRoute = createRoute({
	method: 'patch',
	path: '/api/v1/comments/{id}',
	tags: ['Comments'],
	summary: 'Edit a comment (author only)',
	request: {
		params: z.object({ id: z.string() }),
		body: {
			content: { 'application/json': { schema: UpdateCommentSchema } },
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: envelopeSchema(CommentSchema) } },
			description: 'Comment updated',
		},
		403: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Not the comment author',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Comment not found',
		},
	},
})

export const deleteCommentRoute = createRoute({
	method: 'delete',
	path: '/api/v1/comments/{id}',
	tags: ['Comments'],
	summary: 'Delete a comment (author only)',
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		204: {
			description: 'Comment deleted',
		},
		403: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Not the comment author',
		},
		404: {
			content: { 'application/json': { schema: ErrorResponseSchema } },
			description: 'Comment not found',
		},
	},
})
