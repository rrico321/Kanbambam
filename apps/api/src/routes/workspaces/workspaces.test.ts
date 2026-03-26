import { describe, expect, it, beforeAll } from 'vitest'
import { app } from '../../app'

const API_BASE = '/api/v1/workspaces'
let token: string
let otherToken: string
let userId: string

async function signup(email: string, password: string) {
	const res = await app.request('/api/v1/auth/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})
	const json = await res.json()
	return json.data as { accessToken: string; refreshToken: string }
}

beforeAll(async () => {
	const user1 = await signup(`ws-test-${Date.now()}@test.com`, 'password123')
	token = user1.accessToken
	const user2 = await signup(`ws-other-${Date.now()}@test.com`, 'password123')
	otherToken = user2.accessToken
})

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

describe('Workspace Routes', () => {
	let createdId: string

	describe('POST /api/v1/workspaces', () => {
		it('creates a workspace and returns 201', async () => {
			const res = await authedRequest(API_BASE, {
				method: 'POST',
				body: { name: 'My Workspace' },
			})
			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.data.id).toMatch(/^wks_/)
			expect(json.data.name).toBe('My Workspace')
			expect(json.data.userId).toMatch(/^usr_/)
			expect(json.data.createdAt).toBeDefined()
			expect(json.meta.requestId).toBeDefined()
			createdId = json.data.id
			userId = json.data.userId
		})

		it('returns 400 for empty name', async () => {
			const res = await authedRequest(API_BASE, {
				method: 'POST',
				body: { name: '' },
			})
			expect(res.status).toBe(400)
		})

		it('returns 400 for missing name', async () => {
			const res = await authedRequest(API_BASE, {
				method: 'POST',
				body: {},
			})
			expect(res.status).toBe(400)
		})
	})

	describe('GET /api/v1/workspaces', () => {
		it('lists workspaces for the authenticated user', async () => {
			const res = await authedRequest(API_BASE)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(Array.isArray(json.data)).toBe(true)
			expect(json.data.length).toBeGreaterThanOrEqual(1)
			expect(json.meta.total).toBeGreaterThanOrEqual(1)
		})

		it('does not include other users workspaces', async () => {
			// Create a workspace as the other user
			await authedRequest(API_BASE, {
				method: 'POST',
				body: { name: 'Other User WS' },
				token: otherToken,
			})

			const res = await authedRequest(API_BASE)
			const json = await res.json()
			for (const ws of json.data) {
				expect(ws.userId).toBe(userId)
			}
		})
	})

	describe('GET /api/v1/workspaces/:id', () => {
		it('returns the workspace by id', async () => {
			const res = await authedRequest(`${API_BASE}/${createdId}`)
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.id).toBe(createdId)
			expect(json.data.name).toBe('My Workspace')
		})

		it('returns 404 for non-existent id', async () => {
			const res = await authedRequest(`${API_BASE}/wks_nonexistent1`)
			expect(res.status).toBe(404)
			const json = await res.json()
			expect(json.error.code).toBe('WORKSPACE_NOT_FOUND')
		})

		it('returns 404 when accessing another users workspace', async () => {
			const res = await authedRequest(`${API_BASE}/${createdId}`, {
				token: otherToken,
			})
			expect(res.status).toBe(404)
		})
	})

	describe('PATCH /api/v1/workspaces/:id', () => {
		it('updates the workspace name', async () => {
			const res = await authedRequest(`${API_BASE}/${createdId}`, {
				method: 'PATCH',
				body: { name: 'Updated Workspace' },
			})
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.name).toBe('Updated Workspace')
		})

		it('returns 404 for non-existent id', async () => {
			const res = await authedRequest(`${API_BASE}/wks_nonexistent1`, {
				method: 'PATCH',
				body: { name: 'Test' },
			})
			expect(res.status).toBe(404)
		})

		it('cannot update another users workspace', async () => {
			const res = await authedRequest(`${API_BASE}/${createdId}`, {
				method: 'PATCH',
				body: { name: 'Hacked' },
				token: otherToken,
			})
			expect(res.status).toBe(404)
		})
	})

	describe('DELETE /api/v1/workspaces/:id', () => {
		it('returns 404 for non-existent id', async () => {
			const res = await authedRequest(`${API_BASE}/wks_nonexistent1`, {
				method: 'DELETE',
			})
			expect(res.status).toBe(404)
		})

		it('cannot delete another users workspace', async () => {
			const res = await authedRequest(`${API_BASE}/${createdId}`, {
				method: 'DELETE',
				token: otherToken,
			})
			expect(res.status).toBe(404)
		})

		it('deletes the workspace and returns 204', async () => {
			const res = await authedRequest(`${API_BASE}/${createdId}`, {
				method: 'DELETE',
			})
			expect(res.status).toBe(204)

			// Verify it's gone
			const getRes = await authedRequest(`${API_BASE}/${createdId}`)
			expect(getRes.status).toBe(404)
		})
	})

	describe('Pagination', () => {
		let pagToken: string

		beforeAll(async () => {
			const pagUser = await signup(`ws-pag-${Date.now()}@test.com`, 'password123')
			pagToken = pagUser.accessToken
			// Create 3 workspaces
			for (let i = 0; i < 3; i++) {
				await authedRequest(API_BASE, {
					method: 'POST',
					body: { name: `Paginated WS ${i}` },
					token: pagToken,
				})
			}
		})

		it('paginates with limit=1', async () => {
			const res = await authedRequest(`${API_BASE}?limit=1`, { token: pagToken })
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data).toHaveLength(1)
			expect(json.meta.cursor).not.toBeNull()
			expect(json.meta.total).toBe(3)
		})

		it('follows cursor to get next page', async () => {
			const res1 = await authedRequest(`${API_BASE}?limit=1`, { token: pagToken })
			const json1 = await res1.json()
			const cursor = json1.meta.cursor

			const res2 = await authedRequest(`${API_BASE}?limit=1&cursor=${cursor}`, {
				token: pagToken,
			})
			const json2 = await res2.json()
			expect(json2.data).toHaveLength(1)
			expect(json2.data[0].id).not.toBe(json1.data[0].id)
		})

		it('returns null cursor on last page', async () => {
			const res = await authedRequest(`${API_BASE}?limit=100`, { token: pagToken })
			const json = await res.json()
			expect(json.meta.cursor).toBeNull()
		})
	})
})
