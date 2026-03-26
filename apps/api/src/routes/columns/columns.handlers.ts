import { OpenAPIHono } from '@hono/zod-openapi'
import { and, asc, count, desc, eq, gt } from 'drizzle-orm'
import { db } from '../../db'
import { boards, columns, workspaces } from '../../db/schema'
import { generateId } from '../../lib/id'
import { appendPosition } from '../../lib/fractional-index'
import { decodeCursor, encodeCursor } from '../../lib/pagination'
import {
	listColumnsRoute,
	createColumnRoute,
	getColumnRoute,
	updateColumnRoute,
	deleteColumnRoute,
} from './columns.routes'

// Ownership verification helpers

export async function verifyBoardOwnership(boardId: string, userId: string) {
	const result = await db
		.select({
			id: boards.id,
			name: boards.name,
			workspaceId: boards.workspaceId,
			createdAt: boards.createdAt,
			updatedAt: boards.updatedAt,
		})
		.from(boards)
		.innerJoin(workspaces, eq(boards.workspaceId, workspaces.id))
		.where(and(eq(boards.id, boardId), eq(workspaces.userId, userId)))
	return result.length > 0 ? result[0] : null
}

export async function verifyColumnOwnership(columnId: string, userId: string) {
	const result = await db
		.select({
			id: columns.id,
			name: columns.name,
			position: columns.position,
			boardId: columns.boardId,
			createdAt: columns.createdAt,
			updatedAt: columns.updatedAt,
		})
		.from(columns)
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.innerJoin(workspaces, eq(boards.workspaceId, workspaces.id))
		.where(and(eq(columns.id, columnId), eq(workspaces.userId, userId)))
	return result.length > 0 ? result[0] : null
}

function formatTimestamp(d: Date): string {
	return d.toISOString()
}

function formatColumn(col: {
	id: string
	name: string
	position: string
	boardId: string
	createdAt: Date
	updatedAt: Date
}) {
	return {
		id: col.id,
		name: col.name,
		position: col.position,
		boardId: col.boardId,
		createdAt: formatTimestamp(col.createdAt),
		updatedAt: formatTimestamp(col.updatedAt),
	}
}

export const columnsApp = new OpenAPIHono()

// GET /api/v1/boards/:boardId/columns
columnsApp.openapi(listColumnsRoute, async (c) => {
	const { boardId } = c.req.valid('param')
	const { cursor, limit } = c.req.valid('query')
	const userId = c.get('jwtPayload').sub as string

	const board = await verifyBoardOwnership(boardId, userId)
	if (!board) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Board not found',
					details: {},
				},
			},
			404,
		)
	}

	const conditions = [eq(columns.boardId, boardId)]
	if (cursor) {
		const decodedId = decodeCursor(cursor)
		// Get the position of the cursor column to paginate by position
		const cursorCol = await db
			.select({ position: columns.position })
			.from(columns)
			.where(eq(columns.id, decodedId))
		if (cursorCol.length > 0) {
			conditions.push(gt(columns.position, cursorCol[0].position))
		}
	}

	const [rows, totalResult] = await Promise.all([
		db
			.select()
			.from(columns)
			.where(and(...conditions))
			.orderBy(asc(columns.position))
			.limit(limit + 1),
		db
			.select({ count: count() })
			.from(columns)
			.where(eq(columns.boardId, boardId)),
	])

	const hasMore = rows.length > limit
	const data = (hasMore ? rows.slice(0, limit) : rows).map(formatColumn)
	const nextCursor = hasMore ? encodeCursor(data[data.length - 1].id) : null

	return c.json(
		{
			data,
			meta: {
				total: totalResult[0].count,
				cursor: nextCursor,
			},
		},
		200,
	)
})

// POST /api/v1/boards/:boardId/columns
columnsApp.openapi(createColumnRoute, async (c) => {
	const { boardId } = c.req.valid('param')
	const { name } = c.req.valid('json')
	const userId = c.get('jwtPayload').sub as string

	const board = await verifyBoardOwnership(boardId, userId)
	if (!board) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Board not found',
					details: {},
				},
			},
			404,
		)
	}

	// Get the last column's position
	const lastCol = await db
		.select({ position: columns.position })
		.from(columns)
		.where(eq(columns.boardId, boardId))
		.orderBy(desc(columns.position))
		.limit(1)

	const position = appendPosition(lastCol.length > 0 ? lastCol[0].position : null)
	const id = generateId('column')
	const now = new Date()

	await db.insert(columns).values({
		id,
		name,
		position,
		boardId,
		createdAt: now,
		updatedAt: now,
	})

	return c.json(
		{
			data: formatColumn({ id, name, position, boardId, createdAt: now, updatedAt: now }),
			meta: { requestId: c.get('requestId') || '' },
		},
		201,
	)
})

// GET /api/v1/columns/:id
columnsApp.openapi(getColumnRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = c.get('jwtPayload').sub as string

	const col = await verifyColumnOwnership(id, userId)
	if (!col) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Column not found',
					details: {},
				},
			},
			404,
		)
	}

	return c.json(
		{
			data: formatColumn(col),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

// PATCH /api/v1/columns/:id
columnsApp.openapi(updateColumnRoute, async (c) => {
	const { id } = c.req.valid('param')
	const body = c.req.valid('json')
	const userId = c.get('jwtPayload').sub as string

	const col = await verifyColumnOwnership(id, userId)
	if (!col) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Column not found',
					details: {},
				},
			},
			404,
		)
	}

	const updates: Record<string, unknown> = { updatedAt: new Date() }
	if (body.name !== undefined) updates.name = body.name
	if (body.position !== undefined) updates.position = body.position

	const result = await db.update(columns).set(updates).where(eq(columns.id, id)).returning()
	const updated = result[0]

	return c.json(
		{
			data: formatColumn(updated),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

// DELETE /api/v1/columns/:id
columnsApp.openapi(deleteColumnRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = c.get('jwtPayload').sub as string

	const col = await verifyColumnOwnership(id, userId)
	if (!col) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Column not found',
					details: {},
				},
			},
			404,
		)
	}

	await db.delete(columns).where(eq(columns.id, id))

	return c.body(null, 204)
})
