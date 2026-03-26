import { OpenAPIHono } from '@hono/zod-openapi'
import { and, count, eq, gt } from 'drizzle-orm'
import { db } from '../../db'
import { boards, workspaces } from '../../db/schema'
import { generateId } from '../../lib/id'
import { encodeCursor, decodeCursor } from '../../lib/pagination'
import {
	listBoardsRoute,
	createBoardRoute,
	getBoardRoute,
	updateBoardRoute,
	deleteBoardRoute,
} from './boards.routes'

/** Verify workspace belongs to the authenticated user. Returns true if owned. */
async function verifyWorkspaceOwnership(
	workspaceId: string,
	userId: string,
): Promise<boolean> {
	const rows = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
	return rows.length > 0
}

/** Verify board belongs to the authenticated user via its workspace. Returns the board or null. */
async function getBoardWithOwnership(boardId: string, userId: string) {
	const rows = await db
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
	return rows.length > 0 ? rows[0] : null
}

function formatBoard(b: {
	id: string
	name: string
	workspaceId: string
	createdAt: Date
	updatedAt: Date
}) {
	return {
		id: b.id,
		name: b.name,
		workspaceId: b.workspaceId,
		createdAt: b.createdAt.toISOString(),
		updatedAt: b.updatedAt.toISOString(),
	}
}

export const boardsApp = new OpenAPIHono()

boardsApp.openapi(listBoardsRoute, async (c) => {
	const { workspaceId } = c.req.valid('param')
	const { cursor, limit } = c.req.valid('query')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	// Verify workspace ownership
	const owned = await verifyWorkspaceOwnership(workspaceId, userId)
	if (!owned) {
		return c.json(
			{
				error: {
					code: 'WORKSPACE_NOT_FOUND',
					message: 'Workspace not found',
					details: {},
				},
			},
			404,
		)
	}

	const conditions = [eq(boards.workspaceId, workspaceId)]
	if (cursor) {
		conditions.push(gt(boards.id, decodeCursor(cursor)))
	}

	const rows = await db
		.select()
		.from(boards)
		.where(and(...conditions))
		.orderBy(boards.id)
		.limit(limit + 1)

	const hasMore = rows.length > limit
	const items = hasMore ? rows.slice(0, limit) : rows
	const nextCursor = hasMore ? encodeCursor(items[items.length - 1].id) : null

	const [{ value: total }] = await db
		.select({ value: count() })
		.from(boards)
		.where(eq(boards.workspaceId, workspaceId))

	return c.json(
		{
			data: items.map(formatBoard),
			meta: { total, cursor: nextCursor },
		},
		200,
	)
})

boardsApp.openapi(createBoardRoute, async (c) => {
	const { workspaceId } = c.req.valid('param')
	const { name } = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	// Verify workspace ownership
	const owned = await verifyWorkspaceOwnership(workspaceId, userId)
	if (!owned) {
		return c.json(
			{
				error: {
					code: 'WORKSPACE_NOT_FOUND',
					message: 'Workspace not found',
					details: {},
				},
			},
			404,
		)
	}

	const id = generateId('board')
	const now = new Date()

	await db.insert(boards).values({
		id,
		name,
		workspaceId,
		createdAt: now,
		updatedAt: now,
	})

	return c.json(
		{
			data: {
				id,
				name,
				workspaceId,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
			},
			meta: { requestId: c.get('requestId') || '' },
		},
		201,
	)
})

boardsApp.openapi(getBoardRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const board = await getBoardWithOwnership(id, userId)
	if (!board) {
		return c.json(
			{
				error: {
					code: 'BOARD_NOT_FOUND',
					message: 'Board not found',
					details: {},
				},
			},
			404,
		)
	}

	return c.json(
		{
			data: formatBoard(board),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

boardsApp.openapi(updateBoardRoute, async (c) => {
	const { id } = c.req.valid('param')
	const { name } = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	// First verify ownership
	const existing = await getBoardWithOwnership(id, userId)
	if (!existing) {
		return c.json(
			{
				error: {
					code: 'BOARD_NOT_FOUND',
					message: 'Board not found',
					details: {},
				},
			},
			404,
		)
	}

	const now = new Date()
	const rows = await db
		.update(boards)
		.set({ name, updatedAt: now })
		.where(eq(boards.id, id))
		.returning()

	return c.json(
		{
			data: formatBoard(rows[0]),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

boardsApp.openapi(deleteBoardRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	// Verify ownership
	const existing = await getBoardWithOwnership(id, userId)
	if (!existing) {
		return c.json(
			{
				error: {
					code: 'BOARD_NOT_FOUND',
					message: 'Board not found',
					details: {},
				},
			},
			404,
		)
	}

	await db.delete(boards).where(eq(boards.id, id))

	return new Response(null, { status: 204 })
})
