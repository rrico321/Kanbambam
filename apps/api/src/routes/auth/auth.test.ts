import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { app } from '../../app'

const API_BASE = '/api/v1/auth'

function jsonRequest(path: string, body: Record<string, unknown>) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
}

describe('Auth Routes', () => {
	describe('POST /api/v1/auth/signup', () => {
		it('returns 201 with accessToken and refreshToken for valid input', async () => {
			const res = await jsonRequest(`${API_BASE}/signup`, {
				email: `signup-${Date.now()}@test.com`,
				password: 'password123',
			})
			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.data).toHaveProperty('accessToken')
			expect(json.data).toHaveProperty('refreshToken')
			expect(typeof json.data.accessToken).toBe('string')
			expect(typeof json.data.refreshToken).toBe('string')
		})

		it('returns 409 with DUPLICATE_EMAIL for duplicate email', async () => {
			const email = `dup-${Date.now()}@test.com`
			// First signup succeeds
			await jsonRequest(`${API_BASE}/signup`, { email, password: 'password123' })
			// Second signup fails
			const res = await jsonRequest(`${API_BASE}/signup`, { email, password: 'password456' })
			expect(res.status).toBe(409)
			const json = await res.json()
			expect(json.error.code).toBe('DUPLICATE_EMAIL')
		})

		it('returns 400 for password less than 8 chars', async () => {
			const res = await jsonRequest(`${API_BASE}/signup`, {
				email: `short-${Date.now()}@test.com`,
				password: 'short',
			})
			expect(res.status).toBe(400)
		})
	})

	describe('POST /api/v1/auth/login', () => {
		const loginEmail = `login-${Date.now()}@test.com`
		const loginPassword = 'password123'

		beforeAll(async () => {
			await jsonRequest(`${API_BASE}/signup`, { email: loginEmail, password: loginPassword })
		})

		it('returns 200 with tokens for valid credentials', async () => {
			const res = await jsonRequest(`${API_BASE}/login`, {
				email: loginEmail,
				password: loginPassword,
			})
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data).toHaveProperty('accessToken')
			expect(json.data).toHaveProperty('refreshToken')
		})

		it('returns 401 INVALID_CREDENTIALS for wrong password', async () => {
			const res = await jsonRequest(`${API_BASE}/login`, {
				email: loginEmail,
				password: 'wrongpassword',
			})
			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error.code).toBe('INVALID_CREDENTIALS')
		})

		it('returns 401 INVALID_CREDENTIALS for non-existent email', async () => {
			const res = await jsonRequest(`${API_BASE}/login`, {
				email: 'nonexistent@test.com',
				password: 'password123',
			})
			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error.code).toBe('INVALID_CREDENTIALS')
		})
	})

	describe('POST /api/v1/auth/refresh', () => {
		it('returns 200 with new token pair for valid refresh token', async () => {
			const email = `refresh-${Date.now()}@test.com`
			const signupRes = await jsonRequest(`${API_BASE}/signup`, {
				email,
				password: 'password123',
			})
			const { refreshToken } = (await signupRes.json()).data

			const res = await jsonRequest(`${API_BASE}/refresh`, { refreshToken })
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data).toHaveProperty('accessToken')
			expect(json.data).toHaveProperty('refreshToken')
			// New refresh token should be different (rotation)
			expect(json.data.refreshToken).not.toBe(refreshToken)
		})

		it('returns 401 for invalid refresh token', async () => {
			const res = await jsonRequest(`${API_BASE}/refresh`, {
				refreshToken: 'invalid-token-value',
			})
			expect(res.status).toBe(401)
		})
	})

	describe('POST /api/v1/auth/logout', () => {
		it('returns 200 with success message for valid refresh token', async () => {
			const email = `logout-${Date.now()}@test.com`
			const signupRes = await jsonRequest(`${API_BASE}/signup`, {
				email,
				password: 'password123',
			})
			const { refreshToken } = (await signupRes.json()).data

			const res = await jsonRequest(`${API_BASE}/logout`, { refreshToken })
			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.data.message).toBe('Logged out successfully')
		})

		it('returns 401 for invalid refresh token', async () => {
			const res = await jsonRequest(`${API_BASE}/logout`, {
				refreshToken: 'invalid-token-value',
			})
			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error.code).toBe('INVALID_REFRESH_TOKEN')
		})

		it('invalidates refresh token so it cannot be used again', async () => {
			const email = `logout-reuse-${Date.now()}@test.com`
			const signupRes = await jsonRequest(`${API_BASE}/signup`, {
				email,
				password: 'password123',
			})
			const { refreshToken } = (await signupRes.json()).data

			// Logout succeeds
			const logoutRes = await jsonRequest(`${API_BASE}/logout`, { refreshToken })
			expect(logoutRes.status).toBe(200)

			// Trying to refresh with the same token fails
			const refreshRes = await jsonRequest(`${API_BASE}/refresh`, { refreshToken })
			expect(refreshRes.status).toBe(401)
		})
	})

	describe('Protected route access', () => {
		it('access token from signup allows access to protected routes', async () => {
			const email = `access-${Date.now()}@test.com`
			const signupRes = await jsonRequest(`${API_BASE}/signup`, {
				email,
				password: 'password123',
			})
			const { accessToken } = (await signupRes.json()).data

			const res = await app.request('/api/v1/workspaces', {
				headers: { Authorization: `Bearer ${accessToken}` },
			})
			// Should not be 401 (auth passed), may be 404 since no route handler yet
			expect(res.status).not.toBe(401)
		})
	})
})
