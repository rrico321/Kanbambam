import { OpenAPIHono } from '@hono/zod-openapi'
import { and, asc, count, desc, eq, gt, sql } from 'drizzle-orm'
import { db } from '../../db'
import { boards, columns, items, workspaces } from '../../db/schema'
import { generateId } from '../../lib/id'
import { appendPosition } from '../../lib/fractional-index'
import { decodeCursor, encodeCursor } from '../../lib/pagination'
import { verifyColumnOwnership } from '../columns/columns.handlers'
import {
	listItemsRoute,
	createItemRoute,
	getItemRoute,
	updateItemRoute,
	deleteItemRoute,
	moveItemRoute,
} from './items.routes'

// Ownership verification for items (item -> column -> board -> workspace -> user)

async function verifyItemOwnership(itemId: string, userId: string) {
	const result = await db
		.select({
			id: items.id,
			title: items.title,
			description: items.description,
			position: items.position,
			columnId: items.columnId,
			dueDate: items.dueDate,
			labels: items.labels,
			assignedTo: items.assignedTo,
			createdAt: items.createdAt,
			updatedAt: items.updatedAt,
		})
		.from(items)
		.innerJoin(columns, eq(items.columnId, columns.id))
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.innerJoin(workspaces, eq(boards.workspaceId, workspaces.id))
		.where(and(eq(items.id, itemId), eq(workspaces.userId, userId)))
	return result.length > 0 ? result[0] : null
}

function formatTimestamp(d: Date | null): string | null {
	return d ? d.toISOString() : null
}

function formatItem(item: {
	id: string
	title: string
	description: string | null
	position: string
	columnId: string
	dueDate: Date | null
	labels: string[] | null
	assignedTo: string | null
	createdAt: Date
	updatedAt: Date
}) {
	return {
		id: item.id,
		title: item.title,
		description: item.description,
		position: item.position,
		columnId: item.columnId,
		dueDate: formatTimestamp(item.dueDate),
		labels: item.labels,
		assignedTo: item.assignedTo,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString(),
	}
}

export const itemsApp = new OpenAPIHono()

// GET /api/v1/columns/:columnId/items
itemsApp.openapi(listItemsRoute, async (c) => {
	const { columnId } = c.req.valid('param')
	const { cursor, limit } = c.req.valid('query')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const col = await verifyColumnOwnership(columnId, userId)
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

	const conditions = [eq(items.columnId, columnId)]
	if (cursor) {
		const decodedId = decodeCursor(cursor)
		const cursorItem = await db
			.select({ position: items.position })
			.from(items)
			.where(eq(items.id, decodedId))
		if (cursorItem.length > 0) {
			conditions.push(
				sql`${items.position} COLLATE "C" > ${cursorItem[0].position} COLLATE "C"`,
			)
		}
	}

	const [rows, totalResult] = await Promise.all([
		db
			.select()
			.from(items)
			.where(and(...conditions))
			.orderBy(sql`${items.position} COLLATE "C" ASC`)
			.limit(limit + 1),
		db
			.select({ count: count() })
			.from(items)
			.where(eq(items.columnId, columnId)),
	])

	const hasMore = rows.length > limit
	const data = (hasMore ? rows.slice(0, limit) : rows).map(formatItem)
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

// POST /api/v1/columns/:columnId/items
itemsApp.openapi(createItemRoute, async (c) => {
	const { columnId } = c.req.valid('param')
	const body = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const col = await verifyColumnOwnership(columnId, userId)
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

	// Get last item position in this column
	const lastItem = await db
		.select({ position: items.position })
		.from(items)
		.where(eq(items.columnId, columnId))
		.orderBy(sql`${items.position} COLLATE "C" DESC`)
		.limit(1)

	const position = appendPosition(lastItem.length > 0 ? lastItem[0].position : null)
	const id = generateId('item')
	const now = new Date()

	await db.insert(items).values({
		id,
		title: body.title,
		description: body.description ?? null,
		position,
		columnId,
		dueDate: null,
		labels: null,
		assignedTo: null,
		createdAt: now,
		updatedAt: now,
	})

	return c.json(
		{
			data: formatItem({
				id,
				title: body.title,
				description: body.description ?? null,
				position,
				columnId,
				dueDate: null,
				labels: null,
				assignedTo: null,
				createdAt: now,
				updatedAt: now,
			}),
			meta: { requestId: c.get('requestId') || '' },
		},
		201,
	)
})

// GET /api/v1/items/:id
itemsApp.openapi(getItemRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const item = await verifyItemOwnership(id, userId)
	if (!item) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Item not found',
					details: {},
				},
			},
			404,
		)
	}

	return c.json(
		{
			data: formatItem(item),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

// PATCH /api/v1/items/:id
itemsApp.openapi(updateItemRoute, async (c) => {
	const { id } = c.req.valid('param')
	const body = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const item = await verifyItemOwnership(id, userId)
	if (!item) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Item not found',
					details: {},
				},
			},
			404,
		)
	}

	const updates: Record<string, unknown> = { updatedAt: new Date() }
	if (body.title !== undefined) updates.title = body.title
	if (body.description !== undefined) updates.description = body.description
	if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null
	if (body.labels !== undefined) updates.labels = body.labels
	if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo

	const result = await db.update(items).set(updates).where(eq(items.id, id)).returning()
	const updated = result[0]

	return c.json(
		{
			data: formatItem(updated),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

// DELETE /api/v1/items/:id
itemsApp.openapi(deleteItemRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const item = await verifyItemOwnership(id, userId)
	if (!item) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Item not found',
					details: {},
				},
			},
			404,
		)
	}

	await db.delete(items).where(eq(items.id, id))

	return c.body(null, 204)
})

// POST /api/v1/items/:id/move
itemsApp.openapi(moveItemRoute, async (c) => {
	const { id } = c.req.valid('param')
	const body = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	// Verify source item ownership
	const item = await verifyItemOwnership(id, userId)
	if (!item) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Item not found',
					details: {},
				},
			},
			404,
		)
	}

	// Verify target column ownership
	const targetCol = await verifyColumnOwnership(body.columnId, userId)
	if (!targetCol) {
		return c.json(
			{
				error: {
					code: 'NOT_FOUND',
					message: 'Target column not found',
					details: {},
				},
			},
			404,
		)
	}

	let position: string
	if (body.position) {
		position = body.position
	} else {
		// Append to end of target column
		const lastItem = await db
			.select({ position: items.position })
			.from(items)
			.where(eq(items.columnId, body.columnId))
			.orderBy(sql`${items.position} COLLATE "C" DESC`)
			.limit(1)
		position = appendPosition(lastItem.length > 0 ? lastItem[0].position : null)
	}

	const now = new Date()
	const result = await db
		.update(items)
		.set({
			columnId: body.columnId,
			position,
			updatedAt: now,
		})
		.where(eq(items.id, id))
		.returning()

	const updated = result[0]

	return c.json(
		{
			data: formatItem(updated),
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})
