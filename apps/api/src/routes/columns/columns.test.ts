import { describe, expect, it, beforeAll } from 'vitest'
import { app } from '../../app'
import { createTestToken } from '../../test-helpers/setup'
import { insertBetween } from '../../lib/fractional-index'

const USER_A_ID = 'usr_testcoluser1'
const USER_B_ID = 'usr_testcoluser2'

let tokenA: string
let tokenB: string

// Helper to set up a full ownership chain for a user
async function setupBoardForUser(userId: string, token: string) {
	// We need workspace and board in the DB for the ownership chain.
	// Since workspace/board routes may not exist yet, insert directly via API signup + DB.
	// Instead, use the auth flow + direct DB inserts via our test helper approach.
	// For integration tests, we'll create the data through direct DB calls.
	const { db } = await import('../../db')
	const { workspaces, boards } = await import('../../db/schema')
	const { generateId } = await import('../../lib/id')

	const wsId = generateId('workspace')
	const brdId = generateId('board')
	const now = new Date()

	await db.insert(workspaces).values({
		id: wsId,
		name: `Test Workspace ${userId}`,
		userId,
		createdAt: now,
		updatedAt: now,
	})

	await db.insert(boards).values({
		id: brdId,
		name: `Test Board ${userId}`,
		workspaceId: wsId,
		createdAt: now,
		updatedAt: now,
	})

	return { workspaceId: wsId, boardId: brdId }
}

let boardA: { workspaceId: string; boardId: string }
let boardB: { workspaceId: string; boardId: string }

beforeAll(async () => {
	// Create test users in DB
	const { db } = await import('../../db')
	const { users } = await import('../../db/schema')
	const argon2 = await import('argon2')

	const hashA = await argon2.hash('password123')
	const hashB = await argon2.hash('password123')

	await db
		.insert(users)
		.values([
			{ id: USER_A_ID, email: `coltest-a-${Date.now()}@test.com`, passwordHash: hashA },
			{ id: USER_B_ID, email: `coltest-b-${Date.now()}@test.com`, passwordHash: hashB },
		])
		.onConflictDoNothing()

	tokenA = await createTestToken(USER_A_ID)
	tokenB = await createTestToken(USER_B_ID)

	boardA = await setupBoardForUser(USER_A_ID, tokenA)
	boardB = await setupBoardForUser(USER_B_ID, tokenB)
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

describe('Column Routes', () => {
	describe('CRUD happy path', () => {
		let createdColumnId: string

		it('POST /api/v1/boards/:boardId/columns creates a column', async () => {
			const res = await authedPost(
				`/api/v1/boards/${boardA.boardId}/columns`,
				{ name: 'To Do' },
				tokenA,
			)
			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.data.name).toBe('To Do')
			expect(json.data.id).toMatch(/^col_/)
			expect(json.data.boardId).toBe(boardA.boardId)
			expect(json.data.position).toBeTruthy()
			expect(json.meta.requestId).toBeDefined()
			createdColumnId = json.data.id
		})

		it('GET /api/v1/boards/:boardId/columns lists columns', async () => {
			const res = await authedGet(
				`/api/v1/boards/${boardA.boardId}/columns`,
				tokenA,
			)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.length).toBeGreaterThanOrEqual(1)
			expect(json.meta.total).toBeGreaterThanOrEqual(1)
		})

		it('GET /api/v1/columns/:id gets a single column', async () => {
			const res = await authedGet(`/api/v1/columns/${createdColumnId}`, tokenA)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.id).toBe(createdColumnId)
			expect(json.data.name).toBe('To Do')
		})

		it('PATCH /api/v1/columns/:id updates a column', async () => {
			const res = await authedPatch(
				`/api/v1/columns/${createdColumnId}`,
				{ name: 'In Progress' },
				tokenA,
			)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.name).toBe('In Progress')
		})

		it('DELETE /api/v1/columns/:id deletes a column', async () => {
			// Create a column to delete
			const createRes = await authedPost(
				`/api/v1/boards/${boardA.boardId}/columns`,
				{ name: 'Delete Me' },
				tokenA,
			)
			const { id } = (await createRes.json()).data

			const res = await authedDelete(`/api/v1/columns/${id}`, tokenA)
			expect(res.status).toBe(204)

			// Verify it's gone
			const getRes = await authedGet(`/api/v1/columns/${id}`, tokenA)
			expect(getRes.status).toBe(404)
		})
	})

	describe('Fractional indexing and ordering', () => {
		let orderedBoardId: string

		beforeAll(async () => {
			// Create a fresh board for ordering tests
			const { db } = await import('../../db')
			const { boards } = await import('../../db/schema')
			const { generateId } = await import('../../lib/id')

			const brdId = generateId('board')
			await db.insert(boards).values({
				id: brdId,
				name: 'Ordering Test Board',
				workspaceId: boardA.workspaceId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			orderedBoardId = brdId
		})

		it('creates columns with incrementing positions', async () => {
			const names = ['Col A', 'Col B', 'Col C']
			const positions: string[] = []

			for (const name of names) {
				const res = await authedPost(
					`/api/v1/boards/${orderedBoardId}/columns`,
					{ name },
					tokenA,
				)
				const json = await res.json()
				positions.push(json.data.position)
			}

			// Positions should be in ascending order
			expect(positions[0] < positions[1]).toBe(true)
			expect(positions[1] < positions[2]).toBe(true)
		})

		it('lists columns in position order', async () => {
			const res = await authedGet(
				`/api/v1/boards/${orderedBoardId}/columns`,
				tokenA,
			)
			const json = await res.json()
			const names = json.data.map((c: { name: string }) => c.name)
			expect(names).toEqual(['Col A', 'Col B', 'Col C'])
		})

		it('reorders a column via PATCH with new position', async () => {
			// Get current columns
			const listRes = await authedGet(
				`/api/v1/boards/${orderedBoardId}/columns`,
				tokenA,
			)
			const cols = (await listRes.json()).data

			// Move Col C between Col A and Col B
			const newPosition = insertBetween(cols[0].position, cols[1].position)
			await authedPatch(
				`/api/v1/columns/${cols[2].id}`,
				{ position: newPosition },
				tokenA,
			)

			// Verify new order
			const verifyRes = await authedGet(
				`/api/v1/boards/${orderedBoardId}/columns`,
				tokenA,
			)
			const updatedCols = (await verifyRes.json()).data
			const updatedNames = updatedCols.map((c: { name: string }) => c.name)
			expect(updatedNames).toEqual(['Col A', 'Col C', 'Col B'])
		})
	})

	describe('Cursor pagination', () => {
		let paginationBoardId: string

		beforeAll(async () => {
			const { db } = await import('../../db')
			const { boards, columns } = await import('../../db/schema')
			const { generateId } = await import('../../lib/id')
			const { generatePositions } = await import('../../lib/fractional-index')

			const brdId = generateId('board')
			await db.insert(boards).values({
				id: brdId,
				name: 'Pagination Test Board',
				workspaceId: boardA.workspaceId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			paginationBoardId = brdId

			// Insert 5 columns
			const positions = generatePositions(5)
			for (let i = 0; i < 5; i++) {
				await db.insert(columns).values({
					id: generateId('column'),
					name: `Page Col ${i + 1}`,
					position: positions[i],
					boardId: brdId,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
			}
		})

		it('returns limited results and cursor', async () => {
			const res = await authedGet(
				`/api/v1/boards/${paginationBoardId}/columns?limit=2`,
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
				`/api/v1/boards/${paginationBoardId}/columns?limit=2`,
				tokenA,
			)
			const firstJson = await firstRes.json()

			const secondRes = await authedGet(
				`/api/v1/boards/${paginationBoardId}/columns?limit=2&cursor=${firstJson.meta.cursor}`,
				tokenA,
			)
			const secondJson = await secondRes.json()
			expect(secondJson.data.length).toBe(2)
			expect(secondJson.data[0].name).toBe('Page Col 3')
		})
	})

	describe('Error handling', () => {
		it('returns 404 for non-existent column', async () => {
			const res = await authedGet('/api/v1/columns/col_nonexistent1', tokenA)
			expect(res.status).toBe(404)
			const json = await res.json()
			expect(json.error.code).toBe('NOT_FOUND')
		})

		it('returns 404 for non-existent board when listing', async () => {
			const res = await authedGet(
				'/api/v1/boards/brd_nonexistent1/columns',
				tokenA,
			)
			expect(res.status).toBe(404)
		})
	})

	describe('Ownership enforcement', () => {
		it('user B cannot access columns in user A board', async () => {
			// Create a column as user A
			const createRes = await authedPost(
				`/api/v1/boards/${boardA.boardId}/columns`,
				{ name: 'Private Column' },
				tokenA,
			)
			const { id } = (await createRes.json()).data

			// User B tries to get it
			const res = await authedGet(`/api/v1/columns/${id}`, tokenB)
			expect(res.status).toBe(404)
		})

		it('user B cannot list columns in user A board', async () => {
			const res = await authedGet(
				`/api/v1/boards/${boardA.boardId}/columns`,
				tokenB,
			)
			expect(res.status).toBe(404)
		})

		it('user B cannot create columns in user A board', async () => {
			const res = await authedPost(
				`/api/v1/boards/${boardA.boardId}/columns`,
				{ name: 'Injected' },
				tokenB,
			)
			expect(res.status).toBe(404)
		})
	})
})
