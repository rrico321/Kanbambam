import { OpenAPIHono } from '@hono/zod-openapi'
import { and, count, eq, gt } from 'drizzle-orm'
import { db } from '../../db'
import { workspaces } from '../../db/schema'
import { generateId } from '../../lib/id'
import { encodeCursor, decodeCursor } from '../../lib/pagination'
import {
	listWorkspacesRoute,
	createWorkspaceRoute,
	getWorkspaceRoute,
	updateWorkspaceRoute,
	deleteWorkspaceRoute,
} from './workspaces.routes'

export const workspacesApp = new OpenAPIHono()

workspacesApp.openapi(listWorkspacesRoute, async (c) => {
	const { cursor, limit } = c.req.valid('query')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const conditions = [eq(workspaces.userId, userId)]
	if (cursor) {
		conditions.push(gt(workspaces.id, decodeCursor(cursor)))
	}

	const rows = await db
		.select()
		.from(workspaces)
		.where(and(...conditions))
		.orderBy(workspaces.id)
		.limit(limit + 1)

	const hasMore = rows.length > limit
	const items = hasMore ? rows.slice(0, limit) : rows
	const nextCursor = hasMore ? encodeCursor(items[items.length - 1].id) : null

	const [{ value: total }] = await db
		.select({ value: count() })
		.from(workspaces)
		.where(eq(workspaces.userId, userId))

	return c.json(
		{
			data: items.map((w) => ({
				id: w.id,
				name: w.name,
				userId: w.userId,
				createdAt: w.createdAt.toISOString(),
				updatedAt: w.updatedAt.toISOString(),
			})),
			meta: { total, cursor: nextCursor },
		},
		200,
	)
})

workspacesApp.openapi(createWorkspaceRoute, async (c) => {
	const { name } = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub
	const id = generateId('workspace')
	const now = new Date()

	await db.insert(workspaces).values({
		id,
		name,
		userId,
		createdAt: now,
		updatedAt: now,
	})

	return c.json(
		{
			data: {
				id,
				name,
				userId,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
			},
			meta: { requestId: c.get('requestId') || '' },
		},
		201,
	)
})

workspacesApp.openapi(getWorkspaceRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const rows = await db
		.select()
		.from(workspaces)
		.where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))

	if (rows.length === 0) {
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

	const w = rows[0]
	return c.json(
		{
			data: {
				id: w.id,
				name: w.name,
				userId: w.userId,
				createdAt: w.createdAt.toISOString(),
				updatedAt: w.updatedAt.toISOString(),
			},
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

workspacesApp.openapi(updateWorkspaceRoute, async (c) => {
	const { id } = c.req.valid('param')
	const { name } = c.req.valid('json')
	const userId = (c.get('jwtPayload') as { sub: string }).sub
	const now = new Date()

	const rows = await db
		.update(workspaces)
		.set({ name, updatedAt: now })
		.where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
		.returning()

	if (rows.length === 0) {
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

	const w = rows[0]
	return c.json(
		{
			data: {
				id: w.id,
				name: w.name,
				userId: w.userId,
				createdAt: w.createdAt.toISOString(),
				updatedAt: w.updatedAt.toISOString(),
			},
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

workspacesApp.openapi(deleteWorkspaceRoute, async (c) => {
	const { id } = c.req.valid('param')
	const userId = (c.get('jwtPayload') as { sub: string }).sub

	const rows = await db
		.delete(workspaces)
		.where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
		.returning({ id: workspaces.id })

	if (rows.length === 0) {
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

	return new Response(null, { status: 204 })
})
