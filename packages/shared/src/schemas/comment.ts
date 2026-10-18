import { z } from 'zod'
import { PaginationQuerySchema, TimestampFields } from './common'

export const COMMENT_BODY_MAX_LENGTH = 10000

const CommentBodySchema = z.string().trim().min(1).max(COMMENT_BODY_MAX_LENGTH)

export const CommentSchema = z.object({
	id: z.string().startsWith('cmt_'),
	itemId: z.string().startsWith('itm_'),
	authorId: z.string().startsWith('usr_'),
	authorEmail: z.string(),
	body: CommentBodySchema,
	...TimestampFields,
})

export const CreateCommentSchema = z.object({
	body: CommentBodySchema,
})

export const UpdateCommentSchema = z.object({
	body: CommentBodySchema,
})

export const ListCommentsQuerySchema = PaginationQuerySchema.extend({
	order: z.enum(['asc', 'desc']).default('asc'),
})
