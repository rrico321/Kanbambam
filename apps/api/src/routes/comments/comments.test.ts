import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../app'
import { createTestToken } from '../../test-helpers/setup'

const USER_A_ID = 'usr_testcmtuser1'
const USER_B_ID = 'usr_testcmtuser2'

let tokenA: string
let tokenB: string
let itemA: string

async function setupItemForUser(userId: string, suffix: string) {
	const { db } = await import('../../db')
	const { workspaces, boards, columns, items } = await import('../../db/schema')
	const { generateId } = await import('../../lib/id')
	const { appendPosition } = await import('../../lib/fractional-index')

	const wsId = generateId('workspace')
	const brdId = generateId('board')
	const colId = generateId('column')
	const itemId = generateId('item')
	const now = new Date()

	await db.insert(workspaces).values({
		id: wsId,
		name: `Comment Test WS ${suffix}`,
		userId,
		createdAt: now,
		updatedAt: now,
	})
	await db.insert(boards).values({
		id: brdId,
		name: `Comment Test Board ${suffix}`,
		workspaceId: wsId,
		createdAt: now,
		updatedAt: now,
	})
	await db.insert(columns).values({
		id: colId,
		name: `Comment Test Col ${suffix}`,
		position: appendPosition(null),
		boardId: brdId,
		createdAt: now,
		updatedAt: now,
	})
	await db.insert(items).values({
		id: itemId,
		title: `Comment Test Item ${suffix}`,
		position: appendPosition(null),
		columnId: colId,
		createdAt: now,
		updatedAt: now,
	})
	return itemId
}

beforeAll(async () => {
	const { db } = await import('../../db')
	const { users } = await import('../../db/schema')
	const argon2 = await import('argon2')

	const hash = await argon2.hash('password123')
	await db
		.insert(users)
		.values([
			{ id: USER_A_ID, email: `cmttest-a-${Date.now()}@test.com`, passwordHash: hash },
			{ id: USER_B_ID, email: `cmttest-b-${Date.now()}@test.com`, passwordHash: hash },
		])
		.onConflictDoNothing()

	tokenA = await createTestToken(USER_A_ID)
	tokenB = await createTestToken(USER_B_ID)
	itemA = await setupItemForUser(USER_A_ID, 'A')
	await setupItemForUser(USER_B_ID, 'B')
})

function authed(method: string, path: string, token: string, body?: Record<string, unknown>) {
	return app.request(path, {
		method,
		headers: {
			...(body ? { 'Content-Type': 'application/json' } : {}),
			Authorization: `Bearer ${token}`,
		},
		body: body ? JSON.stringify(body) : undefined,
	})
}

describe('Comment Routes', () => {
	describe('CRUD happy path', () => {
		let commentId: string

		it('POST /api/v1/items/:id/comments creates a comment', async () => {
			const res = await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, {
				body: 'Started work on this',
			})
			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.data.id).toMatch(/^cmt_/)
			expect(json.data.itemId).toBe(itemA)
			expect(json.data.authorId).toBe(USER_A_ID)
			expect(json.data.authorEmail).toContain('cmttest-a-')
			expect(json.data.body).toBe('Started work on this')
			expect(json.data.createdAt).toBeDefined()
			expect(json.meta.requestId).toBeDefined()
			commentId = json.data.id
		})

		it('GET /api/v1/items/:id/comments lists comments', async () => {
			const res = await authed('GET', `/api/v1/items/${itemA}/comments`, tokenA)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.map((c: { id: string }) => c.id)).toContain(commentId)
			expect(json.meta.total).toBeGreaterThanOrEqual(1)
		})

		it('PATCH /api/v1/comments/:id edits the body as the author', async () => {
			const res = await authed('PATCH', `/api/v1/comments/${commentId}`, tokenA, {
				body: 'Edited update',
			})
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.body).toBe('Edited update')
			expect(new Date(json.data.updatedAt).getTime()).toBeGreaterThanOrEqual(
				new Date(json.data.createdAt).getTime(),
			)
		})

		it('DELETE /api/v1/comments/:id deletes as the author', async () => {
			const res = await authed('DELETE', `/api/v1/comments/${commentId}`, tokenA)
			expect(res.status).toBe(204)

			const list = await authed('GET', `/api/v1/items/${itemA}/comments`, tokenA)
			const json = await list.json()
			expect(json.data.map((c: { id: string }) => c.id)).not.toContain(commentId)
		})
	})

	describe('Pagination', () => {
		let pagedItem: string

		beforeAll(async () => {
			pagedItem = await setupItemForUser(USER_A_ID, 'paged')
			for (const n of [1, 2, 3, 4, 5]) {
				const res = await authed('POST', `/api/v1/items/${pagedItem}/comments`, tokenA, {
					body: `comment ${n}`,
				})
				expect(res.status).toBe(201)
			}
		})

		it('returns oldest first and follows the cursor', async () => {
			const first = await (
				await authed('GET', `/api/v1/items/${pagedItem}/comments?limit=2`, tokenA)
			).json()
			expect(first.data.map((c: { body: string }) => c.body)).toEqual(['comment 1', 'comment 2'])
			expect(first.meta.total).toBe(5)
			expect(first.meta.cursor).toBeTruthy()

			const second = await (
				await authed(
					'GET',
					`/api/v1/items/${pagedItem}/comments?limit=2&cursor=${first.meta.cursor}`,
					tokenA,
				)
			).json()
			expect(second.data.map((c: { body: string }) => c.body)).toEqual(['comment 3', 'comment 4'])

			const third = await (
				await authed(
					'GET',
					`/api/v1/items/${pagedItem}/comments?limit=2&cursor=${second.meta.cursor}`,
					tokenA,
				)
			).json()
			expect(third.data.map((c: { body: string }) => c.body)).toEqual(['comment 5'])
			expect(third.meta.cursor).toBeNull()
		})
	})

	describe('Validation', () => {
		it('rejects an empty body', async () => {
			const res = await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, { body: '' })
			expect(res.status).toBe(400)
		})

		it('rejects a whitespace-only body', async () => {
			const res = await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, { body: '   ' })
			expect(res.status).toBe(400)
		})

		it('rejects a body over the max length', async () => {
			const res = await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, {
				body: 'x'.repeat(10001),
			})
			expect(res.status).toBe(400)
		})

		it('accepts a body at the max length', async () => {
			const res = await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, {
				body: 'x'.repeat(10000),
			})
			expect(res.status).toBe(201)
		})

		it('rejects an empty body on edit', async () => {
			const created = await (
				await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, { body: 'keep' })
			).json()
			const res = await authed('PATCH', `/api/v1/comments/${created.data.id}`, tokenA, {
				body: '',
			})
			expect(res.status).toBe(400)
		})
	})

	describe('Authorization', () => {
		it('returns 401 without a token', async () => {
			const res = await app.request(`/api/v1/items/${itemA}/comments`)
			expect(res.status).toBe(401)
		})

		it("returns 404 listing another user's item comments", async () => {
			const res = await authed('GET', `/api/v1/items/${itemA}/comments`, tokenB)
			expect(res.status).toBe(404)
		})

		it("returns 404 commenting on another user's item", async () => {
			const res = await authed('POST', `/api/v1/items/${itemA}/comments`, tokenB, { body: 'hi' })
			expect(res.status).toBe(404)
		})

		it('returns 404 for an unknown item', async () => {
			const res = await authed('GET', '/api/v1/items/itm_doesnotexist/comments', tokenA)
			expect(res.status).toBe(404)
		})

		it("returns 404 editing or deleting a comment on another user's board", async () => {
			const created = await (
				await authed('POST', `/api/v1/items/${itemA}/comments`, tokenA, { body: 'mine' })
			).json()
			const patch = await authed('PATCH', `/api/v1/comments/${created.data.id}`, tokenB, {
				body: 'hijack',
			})
			expect(patch.status).toBe(404)
			const del = await authed('DELETE', `/api/v1/comments/${created.data.id}`, tokenB)
			expect(del.status).toBe(404)
		})

		it('returns 403 when a non-author with board access edits or deletes', async () => {
			// Insert a comment authored by user B directly on user A's item
			const { db } = await import('../../db')
			const { comments } = await import('../../db/schema')
			const { generateId } = await import('../../lib/id')
			const id = generateId('comment')
			const now = new Date()
			await db.insert(comments).values({
				id,
				itemId: itemA,
				authorId: USER_B_ID,
				body: 'written by B',
				createdAt: now,
				updatedAt: now,
			})

			const patch = await authed('PATCH', `/api/v1/comments/${id}`, tokenA, { body: 'nope' })
			expect(patch.status).toBe(403)
			expect((await patch.json()).error.code).toBe('FORBIDDEN')

			const del = await authed('DELETE', `/api/v1/comments/${id}`, tokenA)
			expect(del.status).toBe(403)

			const list = await (await authed('GET', `/api/v1/items/${itemA}/comments`, tokenA)).json()
			const found = list.data.find((c: { id: string }) => c.id === id)
			expect(found.body).toBe('written by B')
		})

		it('returns 404 for an unknown comment', async () => {
			const res = await authed('PATCH', '/api/v1/comments/cmt_doesnotexist', tokenA, { body: 'x' })
			expect(res.status).toBe(404)
		})
	})

	describe('Cascade', () => {
		it('deletes comments when the item is deleted', async () => {
			const item = await setupItemForUser(USER_A_ID, 'cascade')
			const created = await (
				await authed('POST', `/api/v1/items/${item}/comments`, tokenA, { body: 'bye' })
			).json()
			const del = await authed('DELETE', `/api/v1/items/${item}`, tokenA)
			expect(del.status).toBe(204)

			const { db } = await import('../../db')
			const { comments } = await import('../../db/schema')
			const { eq } = await import('drizzle-orm')
			const rows = await db.select().from(comments).where(eq(comments.id, created.data.id))
			expect(rows).toHaveLength(0)
		})
	})
})
