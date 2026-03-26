import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the config module before importing api-client
vi.mock('../config.js', () => {
	const store = new Map<string, string>()
	return {
		config: {
			get: (key: string) => store.get(key),
			set: (key: string, value: string) => store.set(key, value),
			delete: (key: string) => store.delete(key),
			store,
			_testStore: store,
		},
		clearTokens: () => {
			store.delete('accessToken')
			store.delete('refreshToken')
		},
		hasTokens: () => !!(store.get('accessToken') && store.get('refreshToken')),
	}
})

import { apiRequest } from '../api-client.js'
import { config } from '../config.js'

describe('apiRequest', () => {
	let fetchMock: ReturnType<typeof vi.fn>
	const mockStore = (config as unknown as { _testStore: Map<string, string> })._testStore

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)
		mockStore.clear()
		mockStore.set('apiBaseUrl', 'http://localhost:3000')
	})

	afterEach(() => {
		vi.restoreAllMocks()
		mockStore.clear()
	})

	it('adds Authorization Bearer header from config', async () => {
		mockStore.set('accessToken', 'tok_abc')
		mockStore.set('refreshToken', 'rt_abc')
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: {} }), { status: 200 }))

		await apiRequest('/api/v1/workspaces')

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, opts] = fetchMock.mock.calls[0]
		expect(url).toBe('http://localhost:3000/api/v1/workspaces')
		expect(opts.headers.get('Authorization')).toBe('Bearer tok_abc')
	})

	it('attempts refresh on 401 using stored refresh token', async () => {
		mockStore.set('accessToken', 'tok_expired')
		mockStore.set('refreshToken', 'rt_valid')

		// First call returns 401
		fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
		// Refresh call succeeds
		fetchMock.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					data: { accessToken: 'tok_new', refreshToken: 'rt_new' },
				}),
				{ status: 200 },
			),
		)
		// Retry original call succeeds
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: {} }), { status: 200 }))

		await apiRequest('/api/v1/workspaces')

		expect(fetchMock).toHaveBeenCalledTimes(3)
		// Second call should be the refresh
		const [refreshUrl] = fetchMock.mock.calls[1]
		expect(refreshUrl).toBe('http://localhost:3000/api/v1/auth/refresh')
	})

	it('throws session expired error and clears tokens on failed refresh', async () => {
		mockStore.set('accessToken', 'tok_expired')
		mockStore.set('refreshToken', 'rt_invalid')

		// First call returns 401
		fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
		// Refresh call fails
		fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))

		await expect(apiRequest('/api/v1/workspaces')).rejects.toThrow('Session expired')
		expect(mockStore.has('accessToken')).toBe(false)
		expect(mockStore.has('refreshToken')).toBe(false)
	})

	it('retries original request with new token after successful refresh', async () => {
		mockStore.set('accessToken', 'tok_expired')
		mockStore.set('refreshToken', 'rt_valid')

		// First call returns 401
		fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
		// Refresh succeeds
		fetchMock.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					data: { accessToken: 'tok_refreshed', refreshToken: 'rt_refreshed' },
				}),
				{ status: 200 },
			),
		)
		// Retry succeeds
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }))

		const result = await apiRequest('/api/v1/workspaces')

		// Retry should use new token
		const [, retryOpts] = fetchMock.mock.calls[2]
		expect(retryOpts.headers.get('Authorization')).toBe('Bearer tok_refreshed')
		expect(result.status).toBe(200)
	})

	it('throws not authenticated when no access token', async () => {
		await expect(apiRequest('/api/v1/workspaces')).rejects.toThrow('Not authenticated')
	})
})
