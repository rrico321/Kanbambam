import { describe, expect, it, beforeAll } from 'vitest'
import { app } from '../../app'

let token: string
let otherToken: string
let workspaceId: string
let otherWorkspaceId: string

async function signup(email: string, password: string) {
	const res = await app.request('/api/v1/auth/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})
	const json = await res.json()
	return json.data as { accessToken: string; refreshToken: string }
}

function authedRequest(
	path: string,
	options: { method?: string; body?: Record<string, unknown>; token?: string } = {},
) {
	const { method = 'GET', body, token: tkn = token } = options
	const headers: Record<string, string> = {
		Authorization: `Bearer ${tkn}`,
	}
	const init: RequestInit = { method, headers }
	if (body) {
		headers['Content-Type'] = 'application/json'
		init.body = JSON.stringify(body)
	}
	return app.request(path, init)
}

beforeAll(async () => {
	const user1 = await signup(`board-test-${Date.now()}@test.com`, 'password123')
	token = user1.accessToken
	const user2 = await signup(`board-other-${Date.now()}@test.com`, 'password123')
	otherToken = user2.accessToken

	// Create workspaces for each user
	const ws1Res = await authedRequest('/api/v1/workspaces', {
		method: 'POST',
		body: { name: 'Board Test WS' },
	})
	workspaceId = (await ws1Res.json()).data.id

	const ws2Res = await authedRequest('/api/v1/workspaces', {
		method: 'POST',
		body: { name: 'Other Board Test WS' },
		token: otherToken,
	})
	otherWorkspaceId = (await ws2Res.json()).data.id
})

describe('Board Routes', () => {
	let createdBoardId: string

	describe('POST /api/v1/workspaces/:workspaceId/boards', () => {
		it('creates a board and returns 201', async () => {
			const res = await authedRequest(`/api/v1/workspaces/${workspaceId}/boards`, {
				method: 'POST',
				body: { name: 'My Board' },
			})
			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.data.id).toMatch(/^brd_/)
			expect(json.data.name).toBe('My Board')
			expect(json.data.workspaceId).toBe(workspaceId)
			expect(json.data.createdAt).toBeDefined()
			expect(json.meta.requestId).toBeDefined()
			createdBoardId = json.data.id
		})

		it('returns 404 when workspace does not exist', async () => {
			const res = await authedRequest('/api/v1/workspaces/wks_nonexistent1/boards', {
				method: 'POST',
				body: { name: 'Test' },
			})
			expect(res.status).toBe(404)
		})

		it('returns 404 when creating in another users workspace', async () => {
			const res = await authedRequest(
				`/api/v1/workspaces/${otherWorkspaceId}/boards`,
				{
					method: 'POST',
					body: { name: 'Hacked' },
				},
			)
			expect(res.status).toBe(404)
		})

		it('returns 400 for empty name', async () => {
			const res = await authedRequest(`/api/v1/workspaces/${workspaceId}/boards`, {
				method: 'POST',
				body: { name: '' },
			})
			expect(res.status).toBe(400)
		})
	})

	describe('GET /api/v1/workspaces/:workspaceId/boards', () => {
		it('lists boards in a workspace', async () => {
			const res = await authedRequest(`/api/v1/workspaces/${workspaceId}/boards`)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(Array.isArray(json.data)).toBe(true)
			expect(json.data.length).toBeGreaterThanOrEqual(1)
			expect(json.meta.total).toBeGreaterThanOrEqual(1)
		})

		it('returns 404 for non-owned workspace', async () => {
			const res = await authedRequest(
				`/api/v1/workspaces/${otherWorkspaceId}/boards`,
			)
			expect(res.status).toBe(404)
		})
	})

	describe('GET /api/v1/boards/:id', () => {
		it('returns the board by id', async () => {
			const res = await authedRequest(`/api/v1/boards/${createdBoardId}`)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.id).toBe(createdBoardId)
			expect(json.data.name).toBe('My Board')
			expect(json.data.workspaceId).toBe(workspaceId)
		})

		it('returns 404 for non-existent id', async () => {
			const res = await authedRequest('/api/v1/boards/brd_nonexistent1')
			expect(res.status).toBe(404)
			const json = await res.json()
			expect(json.error.code).toBe('BOARD_NOT_FOUND')
		})

		it('returns 404 when accessing another users board', async () => {
			const res = await authedRequest(`/api/v1/boards/${createdBoardId}`, {
				token: otherToken,
			})
			expect(res.status).toBe(404)
		})
	})

	describe('PATCH /api/v1/boards/:id', () => {
		it('updates the board name', async () => {
			const res = await authedRequest(`/api/v1/boards/${createdBoardId}`, {
				method: 'PATCH',
				body: { name: 'Updated Board' },
			})
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.name).toBe('Updated Board')
		})

		it('returns 404 for non-existent id', async () => {
			const res = await authedRequest('/api/v1/boards/brd_nonexistent1', {
				method: 'PATCH',
				body: { name: 'Test' },
			})
			expect(res.status).toBe(404)
		})

		it('cannot update another users board', async () => {
			const res = await authedRequest(`/api/v1/boards/${createdBoardId}`, {
				method: 'PATCH',
				body: { name: 'Hacked' },
				token: otherToken,
			})
			expect(res.status).toBe(404)
		})
	})

	describe('DELETE /api/v1/boards/:id', () => {
		it('returns 404 for non-existent id', async () => {
			const res = await authedRequest('/api/v1/boards/brd_nonexistent1', {
				method: 'DELETE',
			})
			expect(res.status).toBe(404)
		})

		it('cannot delete another users board', async () => {
			const res = await authedRequest(`/api/v1/boards/${createdBoardId}`, {
				method: 'DELETE',
				token: otherToken,
			})
			expect(res.status).toBe(404)
		})

		it('deletes the board and returns 204', async () => {
			const res = await authedRequest(`/api/v1/boards/${createdBoardId}`, {
				method: 'DELETE',
			})
			expect(res.status).toBe(204)

			// Verify it's gone
			const getRes = await authedRequest(`/api/v1/boards/${createdBoardId}`)
			expect(getRes.status).toBe(404)
		})
	})

	describe('Pagination', () => {
		let pagToken: string
		let pagWorkspaceId: string

		beforeAll(async () => {
			const pagUser = await signup(`board-pag-${Date.now()}@test.com`, 'password123')
			pagToken = pagUser.accessToken

			const wsRes = await authedRequest('/api/v1/workspaces', {
				method: 'POST',
				body: { name: 'Pagination WS' },
				token: pagToken,
			})
			pagWorkspaceId = (await wsRes.json()).data.id

			// Create 3 boards
			for (let i = 0; i < 3; i++) {
				await authedRequest(`/api/v1/workspaces/${pagWorkspaceId}/boards`, {
					method: 'POST',
					body: { name: `Paginated Board ${i}` },
					token: pagToken,
				})
			}
		})

		it('paginates with limit=1', async () => {
			const res = await authedRequest(
				`/api/v1/workspaces/${pagWorkspaceId}/boards?limit=1`,
				{ token: pagToken },
			)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data).toHaveLength(1)
			expect(json.meta.cursor).not.toBeNull()
			expect(json.meta.total).toBe(3)
		})

		it('follows cursor to get next page', async () => {
			const res1 = await authedRequest(
				`/api/v1/workspaces/${pagWorkspaceId}/boards?limit=1`,
				{ token: pagToken },
			)
			const json1 = await res1.json()
			const cursor = json1.meta.cursor

			const res2 = await authedRequest(
				`/api/v1/workspaces/${pagWorkspaceId}/boards?limit=1&cursor=${cursor}`,
				{ token: pagToken },
			)
			const json2 = await res2.json()
			expect(json2.data).toHaveLength(1)
			expect(json2.data[0].id).not.toBe(json1.data[0].id)
		})

		it('returns null cursor on last page', async () => {
			const res = await authedRequest(
				`/api/v1/workspaces/${pagWorkspaceId}/boards?limit=100`,
				{ token: pagToken },
			)
			const json = await res.json()
			expect(json.meta.cursor).toBeNull()
		})
	})
})
