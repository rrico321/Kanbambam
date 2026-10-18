import { OpenAPIHono } from '@hono/zod-openapi'
import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { boards, columns, comments, items, users, workspaces } from '../../db/schema'
import { generateId } from '../../lib/id'
import { decodeCursor, encodeCursor } from '../../lib/pagination'
import { verifyItemOwnership } from '../items/items.handlers'
import {
	createCommentRoute,
	deleteCommentRoute,
	listCommentsRoute,
	updateCommentRoute,
} from './comments.routes'

const commentColumns = {
	id: comments.id,
	itemId: comments.itemId,
	authorId: comments.authorId,
	authorEmail: users.email,
	body: comments.body,
	createdAt: comments.createdAt,
	updatedAt: comments.updatedAt,
}

// Board access mirrors items: comment -> item -> column -> board -> workspace -> user
async function verifyCommentAccess(commentId: string, userId: string) {
	const result = await db
		.select({ id: comments.id, authorId: comments.authorId })
		.from(comments)
		.innerJoin(items, eq(comments.itemId, items.id))
		.innerJoin(columns, eq(items.columnId, columns.id))
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.innerJoin(workspaces, eq(boards.workspaceId, workspaces.id))
		.where(and(eq(comments.id, commentId), eq(workspaces.userId, userId)))
	return result.length > 0 ? result[0] : null
}

async function getComment(commentId: string) {
	const rows = await db
		.select(commentColumns)
		.from(comments)
		.innerJoin(users, eq(comments.authorId, users.id))
		.where(eq(comments.id, commentId))
	return rows[0]
}

function formatComment(comment: {
	id: string
	itemId: string
	authorId: string
	authorEmail: string
	body: string
	createdAt: Date
	updatedAt: Date
}) {
	return {
		id: comment.id,
		itemId: comment.itemId,
		authorId: comment.authorId,
		authorEmail: comment.authorEmail,
		body: comment.body,
		createdAt: comment.createdAt.toISOString(),
		updatedAt: comment.updatedAt.toISOString(),
	}
}

function notFound(message: string) {
	return { error: { code: 'NOT_FOUND', message, details: {} } }
}

function forbidden(message: string) {
	return { error: { code: 'FORBIDDEN', message, details: {} } }
}

export const commentsApp = new OpenAPIHono()

// GET /api/v1/items/:id/comments
commentsApp.openapi(listCommentsRoute, async (c) => {
	const { id } = c.req.valid('param')
	const { cursor, limit, order } = c.req.valid('query')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const item = await verifyItemOwnership(id, userId)
	if (!item) return c.json(notFound('Item not found'), 404)

	const conditions = [eq(comments.itemId, id)]
	if (cursor) {
		const cursorRow = await db
			.select({ createdAt: comments.createdAt, id: comments.id })
			.from(comments)
			.where(and(eq(comments.id, decodeCursor(cursor)), eq(comments.itemId, id)))
		if (cursorRow.length > 0) {
			conditions.push(
				sql`(${comments.createdAt}, ${comments.id}) ${order === 'desc' ? sql.raw('<') : sql.raw('>')} (${cursorRow[0].createdAt.toISOString()}::timestamptz, ${cursorRow[0].id})`,
			)
		}
	}

	const [rows, totalResult] = await Promise.all([
		db
			.select(commentColumns)
			.from(comments)
			.innerJoin(users, eq(comments.authorId, users.id))
			.where(and(...conditions))
			.orderBy(
				...(order === 'desc'
					? [desc(comments.createdAt), desc(comments.id)]
					: [asc(comments.createdAt), asc(comments.id)]),
			)
			.limit(limit + 1),
		db.select({ count: count() }).from(comments).where(eq(comments.itemId, id)),
	])

	const hasMore = rows.length > limit
	const data = (hasMore ? rows.slice(0, limit) : rows).map(formatComment)
	const nextCursor = hasMore ? encodeCursor(data[data.length - 1].id) : null

	return c.json({ data, meta: { total: totalResult[0].count, cursor: nextCursor } }, 200)
})

// POST /api/v1/items/:id/comments
commentsApp.openapi(createCommentRoute, async (c) => {
	const { id } = c.req.valid('param')
	const body = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const item = await verifyItemOwnership(id, userId)
	if (!item) return c.json(notFound('Item not found'), 404)

	const commentId = generateId('comment')
	const now = new Date()
	await db.insert(comments).values({
		id: commentId,
		itemId: id,
		authorId: userId,
		body: body.body,
		createdAt: now,
		updatedAt: now,
	})

	return c.json(
		{
			data: formatComment(await getComment(commentId)),
			meta: { requestId: c.get('requestId') || '' },
		},
		201,
	)
})

// PATCH /api/v1/comments/:id
commentsApp.openapi(updateCommentRoute, async (c) => {
	const { id } = c.req.valid('param')
	const body = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const access = await verifyCommentAccess(id, userId)
	if (!access) return c.json(notFound('Comment not found'), 404)
	if (access.authorId !== userId) {
		return c.json(forbidden('Only the author can edit this comment'), 403)
	}

	await db
		.update(comments)
		.set({ body: body.body, updatedAt: new Date() })
		.where(eq(comments.id, id))

	return c.json(
		{
			data: formatComment(await getComment(id)),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

// DELETE /api/v1/comments/:id
commentsApp.openapi(deleteCommentRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const access = await verifyCommentAccess(id, userId)
	if (!access) return c.json(notFound('Comment not found'), 404)
	if (access.authorId !== userId) {
		return c.json(forbidden('Only the author can delete this comment'), 403)
	}

	await db.delete(comments).where(eq(comments.id, id))

	return c.body(null, 204)
})
