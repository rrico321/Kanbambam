import { describe, expect, it, beforeAll } from 'vitest'
import { app } from '../../app'
import { createTestToken } from '../../test-helpers/setup'
import { insertBetween } from '../../lib/fractional-index'

const USER_A_ID = 'usr_testitmuser1'
const USER_B_ID = 'usr_testitmuser2'

let tokenA: string
let tokenB: string

// Set up a full ownership chain: user -> workspace -> board -> column
async function setupColumnForUser(userId: string, suffix: string) {
	const { db } = await import('../../db')
	const { workspaces, boards, columns } = await import('../../db/schema')
	const { generateId } = await import('../../lib/id')
	const { appendPosition } = await import('../../lib/fractional-index')

	const wsId = generateId('workspace')
	const brdId = generateId('board')
	const colId = generateId('column')
	const now = new Date()

	await db.insert(workspaces).values({
		id: wsId,
		name: `Item Test WS ${suffix}`,
		userId,
		createdAt: now,
		updatedAt: now,
	})

	await db.insert(boards).values({
		id: brdId,
		name: `Item Test Board ${suffix}`,
		workspaceId: wsId,
		createdAt: now,
		updatedAt: now,
	})

	await db.insert(columns).values({
		id: colId,
		name: `Item Test Col ${suffix}`,
		position: appendPosition(null),
		boardId: brdId,
		createdAt: now,
		updatedAt: now,
	})

	return { workspaceId: wsId, boardId: brdId, columnId: colId }
}

let setupA: { workspaceId: string; boardId: string; columnId: string }
let setupB: { workspaceId: string; boardId: string; columnId: string }

beforeAll(async () => {
	const { db } = await import('../../db')
	const { users } = await import('../../db/schema')
	const argon2 = await import('argon2')

	const hashA = await argon2.hash('password123')
	const hashB = await argon2.hash('password123')

	await db
		.insert(users)
		.values([
			{ id: USER_A_ID, email: `itmtest-a-${Date.now()}@test.com`, passwordHash: hashA },
			{ id: USER_B_ID, email: `itmtest-b-${Date.now()}@test.com`, passwordHash: hashB },
		])
		.onConflictDoNothing()

	tokenA = await createTestToken(USER_A_ID)
	tokenB = await createTestToken(USER_B_ID)

	setupA = await setupColumnForUser(USER_A_ID, 'A')
	setupB = await setupColumnForUser(USER_B_ID, 'B')
})

function authedGet(path: string, token: string) {
	return app.request(path, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` },
	})
}

function authedPost(path: string, body: Record<string, unknown>, token: string) {
	return app.request(path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(body),
	})
}

function authedPatch(path: string, body: Record<string, unknown>, token: string) {
	return app.request(path, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(body),
	})
}

function authedDelete(path: string, token: string) {
	return app.request(path, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` },
	})
}

describe('Item Routes', () => {
	describe('CRUD happy path', () => {
		let createdItemId: string

		it('POST /api/v1/columns/:columnId/items creates an item', async () => {
			const res = await authedPost(
				`/api/v1/columns/${setupA.columnId}/items`,
				{ title: 'My Task', description: 'A description' },
				tokenA,
			)
			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.data.title).toBe('My Task')
			expect(json.data.description).toBe('A description')
			expect(json.data.id).toMatch(/^itm_/)
			expect(json.data.columnId).toBe(setupA.columnId)
			expect(json.data.position).toBeTruthy()
			expect(json.meta.requestId).toBeDefined()
			createdItemId = json.data.id
		})

		it('GET /api/v1/columns/:columnId/items lists items', async () => {
			const res = await authedGet(
				`/api/v1/columns/${setupA.columnId}/items`,
				tokenA,
			)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.length).toBeGreaterThanOrEqual(1)
			expect(json.meta.total).toBeGreaterThanOrEqual(1)
		})

		it('GET /api/v1/items/:id gets a single item', async () => {
			const res = await authedGet(`/api/v1/items/${createdItemId}`, tokenA)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.id).toBe(createdItemId)
			expect(json.data.title).toBe('My Task')
		})

		it('PATCH /api/v1/items/:id updates an item', async () => {
			const dueDate = new Date('2026-12-31T00:00:00Z').toISOString()
			const res = await authedPatch(
				`/api/v1/items/${createdItemId}`,
				{
					title: 'Updated Task',
					labels: ['bug', 'urgent'],
					dueDate,
				},
				tokenA,
			)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.title).toBe('Updated Task')
			expect(json.data.labels).toEqual(['bug', 'urgent'])
			expect(json.data.dueDate).toBeTruthy()
		})

		it('DELETE /api/v1/items/:id deletes an item', async () => {
			const createRes = await authedPost(
				`/api/v1/columns/${setupA.columnId}/items`,
				{ title: 'Delete Me' },
				tokenA,
			)
			const { id } = (await createRes.json()).data

			const res = await authedDelete(`/api/v1/items/${id}`, tokenA)
			expect(res.status).toBe(204)

			const getRes = await authedGet(`/api/v1/items/${id}`, tokenA)
			expect(getRes.status).toBe(404)
		})
	})

	describe('Fractional indexing and ordering', () => {
		let orderColumnId: string

		beforeAll(async () => {
			const { db } = await import('../../db')
			const { columns } = await import('../../db/schema')
			const { generateId } = await import('../../lib/id')
			const { appendPosition } = await import('../../lib/fractional-index')

			const colId = generateId('column')
			await db.insert(columns).values({
				id: colId,
				name: 'Order Test Column',
				position: appendPosition(null),
				boardId: setupA.boardId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			orderColumnId = colId
		})

		it('creates items with incrementing positions', async () => {
			const titles = ['Item A', 'Item B', 'Item C']
			const positions: string[] = []

			for (const title of titles) {
				const res = await authedPost(
					`/api/v1/columns/${orderColumnId}/items`,
					{ title },
					tokenA,
				)
				const json = await res.json()
				positions.push(json.data.position)
			}

			expect(positions[0] < positions[1]).toBe(true)
			expect(positions[1] < positions[2]).toBe(true)
		})

		it('lists items in position order', async () => {
			const res = await authedGet(
				`/api/v1/columns/${orderColumnId}/items`,
				tokenA,
			)
			const json = await res.json()
			const titles = json.data.map((i: { title: string }) => i.title)
			expect(titles).toEqual(['Item A', 'Item B', 'Item C'])
		})
	})

	describe('Move item', () => {
		let moveColumnId1: string
		let moveColumnId2: string

		beforeAll(async () => {
			const { db } = await import('../../db')
			const { columns } = await import('../../db/schema')
			const { generateId } = await import('../../lib/id')
			const { generatePositions } = await import('../../lib/fractional-index')

			const positions = generatePositions(2)
			const col1 = generateId('column')
			const col2 = generateId('column')

			await db.insert(columns).values([
				{
					id: col1,
					name: 'Move Source',
					position: positions[0],
					boardId: setupA.boardId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: col2,
					name: 'Move Target',
					position: positions[1],
					boardId: setupA.boardId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			])
			moveColumnId1 = col1
			moveColumnId2 = col2
		})

		it('moves item between columns', async () => {
			// Create item in col1
			const createRes = await authedPost(
				`/api/v1/columns/${moveColumnId1}/items`,
				{ title: 'Moving Item' },
				tokenA,
			)
			const item = (await createRes.json()).data

			// Move to col2
			const moveRes = await authedPost(
				`/api/v1/items/${item.id}/move`,
				{ columnId: moveColumnId2 },
				tokenA,
			)
			expect(moveRes.status).toBe(200)
			const movedItem = (await moveRes.json()).data
			expect(movedItem.columnId).toBe(moveColumnId2)

			// Verify in col2
			const listRes = await authedGet(
				`/api/v1/columns/${moveColumnId2}/items`,
				tokenA,
			)
			const items = (await listRes.json()).data
			expect(items.some((i: { id: string }) => i.id === item.id)).toBe(true)
		})

		it('moves item within same column (reorder)', async () => {
			// Use a fresh column to avoid interference from previous tests
			const { db: testDb } = await import('../../db')
			const { columns: colTable } = await import('../../db/schema')
			const { generateId: genId } = await import('../../lib/id')
			const { appendPosition: ap } = await import('../../lib/fractional-index')

			const reorderCol = genId('column')
			await testDb.insert(colTable).values({
				id: reorderCol,
				name: 'Reorder Col',
				position: ap(null),
				boardId: setupA.boardId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})

			// Create two items
			const res1 = await authedPost(
				`/api/v1/columns/${reorderCol}/items`,
				{ title: 'First' },
				tokenA,
			)
			const res2 = await authedPost(
				`/api/v1/columns/${reorderCol}/items`,
				{ title: 'Second' },
				tokenA,
			)
			const item1 = (await res1.json()).data
			const item2 = (await res2.json()).data

			// Move item2 before item1 using a position between null and item1
			const newPosition = insertBetween(null, item1.position)
			const moveRes = await authedPost(
				`/api/v1/items/${item2.id}/move`,
				{ columnId: reorderCol, position: newPosition },
				tokenA,
			)
			expect(moveRes.status).toBe(200)

			// Verify order
			const listRes = await authedGet(
				`/api/v1/columns/${reorderCol}/items`,
				tokenA,
			)
			const listItems = (await listRes.json()).data
			const titles = listItems.map((i: { title: string }) => i.title)
			expect(titles).toEqual(['Second', 'First'])
		})
	})

	describe('Cursor pagination', () => {
		let paginationColumnId: string

		beforeAll(async () => {
			const { db } = await import('../../db')
			const { columns, items } = await import('../../db/schema')
			const { generateId } = await import('../../lib/id')
			const { appendPosition, generatePositions } = await import('../../lib/fractional-index')

			const colId = generateId('column')
			await db.insert(columns).values({
				id: colId,
				name: 'Pagination Column',
				position: appendPosition(null),
				boardId: setupA.boardId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			paginationColumnId = colId

			const positions = generatePositions(5)
			for (let i = 0; i < 5; i++) {
				await db.insert(items).values({
					id: generateId('item'),
					title: `Page Item ${i + 1}`,
					description: null,
					position: positions[i],
					columnId: colId,
					dueDate: null,
					labels: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
			}
		})

		it('returns limited results and cursor', async () => {
			const res = await authedGet(
				`/api/v1/columns/${paginationColumnId}/items?limit=2`,
				tokenA,
			)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.length).toBe(2)
			expect(json.meta.cursor).toBeTruthy()
			expect(json.meta.total).toBe(5)
		})

		it('returns next page using cursor', async () => {
			const firstRes = await authedGet(
				`/api/v1/columns/${paginationColumnId}/items?limit=2`,
				tokenA,
			)
			const firstJson = await firstRes.json()

			const secondRes = await authedGet(
				`/api/v1/columns/${paginationColumnId}/items?limit=2&cursor=${firstJson.meta.cursor}`,
				tokenA,
			)
			const secondJson = await secondRes.json()
			expect(secondJson.data.length).toBe(2)
			expect(secondJson.data[0].title).toBe('Page Item 3')
		})
	})

	describe('Error handling', () => {
		it('returns 404 for non-existent item', async () => {
			const res = await authedGet('/api/v1/items/itm_nonexistent1', tokenA)
			expect(res.status).toBe(404)
			const json = await res.json()
			expect(json.error.code).toBe('NOT_FOUND')
		})

		it('returns 404 for non-existent column when listing', async () => {
			const res = await authedGet(
				'/api/v1/columns/col_nonexistent1/items',
				tokenA,
			)
			expect(res.status).toBe(404)
		})
	})

	describe('Ownership enforcement', () => {
		it('user B cannot access items in user A column', async () => {
			const createRes = await authedPost(
				`/api/v1/columns/${setupA.columnId}/items`,
				{ title: 'Private Item' },
				tokenA,
			)
			const { id } = (await createRes.json()).data

			const res = await authedGet(`/api/v1/items/${id}`, tokenB)
			expect(res.status).toBe(404)
		})

		it('user B cannot list items in user A column', async () => {
			const res = await authedGet(
				`/api/v1/columns/${setupA.columnId}/items`,
				tokenB,
			)
			expect(res.status).toBe(404)
		})

		it('user B cannot create items in user A column', async () => {
			const res = await authedPost(
				`/api/v1/columns/${setupA.columnId}/items`,
				{ title: 'Injected' },
				tokenB,
			)
			expect(res.status).toBe(404)
		})

		it('user B cannot move items to user A column', async () => {
			// Create item in user B's column
			const createRes = await authedPost(
				`/api/v1/columns/${setupB.columnId}/items`,
				{ title: 'B Item' },
				tokenB,
			)
			const { id } = (await createRes.json()).data

			// Try to move to user A's column
			const moveRes = await authedPost(
				`/api/v1/items/${id}/move`,
				{ columnId: setupA.columnId },
				tokenB,
			)
			expect(moveRes.status).toBe(404)
		})
	})
})
