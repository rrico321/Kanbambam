import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config, clearTokens, hasTokens } from '../../../lib/config.js'

// Mock ink to avoid yoga-layout WASM loading in tests
vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('logoutCommand', () => {
	beforeEach(() => {
		config.clear()
		mockFetch.mockReset()
	})

	afterEach(() => {
		config.clear()
	})

	it('calls POST /api/v1/auth/logout with stored refresh token', async () => {
		const { logoutCommand } = await import('../logout.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: { message: 'ok' } }), { status: 200 }))

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await logoutCommand({ json: true })
		consoleSpy.mockRestore()

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining('/api/v1/auth/logout'),
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('test_refresh'),
			}),
		)
	})

	it('clears local tokens after API call', async () => {
		const { logoutCommand } = await import('../logout.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await logoutCommand({ json: true })
		consoleSpy.mockRestore()

		expect(hasTokens()).toBe(false)
		expect(config.get('accessToken')).toBeUndefined()
		expect(config.get('refreshToken')).toBeUndefined()
	})

	it('shows success message when logged in', async () => {
		const { logoutCommand } = await import('../logout.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await logoutCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('Logged out successfully')
	})

	it('shows "Not currently logged in." when no tokens stored', async () => {
		const { logoutCommand } = await import('../logout.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await logoutCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('Not currently logged in')
	})

	it('--json outputs API envelope format with logout message', async () => {
		const { logoutCommand } = await import('../logout.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await logoutCommand({ json: true })

		const jsonCall = consoleSpy.mock.calls.find((call) => {
			try {
				const parsed = JSON.parse(call[0] as string)
				return parsed.data?.message === 'Logged out successfully'
			} catch {
				return false
			}
		})
		consoleSpy.mockRestore()

		expect(jsonCall).toBeTruthy()
	})

	it('still clears local tokens even if API call fails (best effort revoke)', async () => {
		const { logoutCommand } = await import('../logout.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		mockFetch.mockRejectedValueOnce(new Error('Network error'))

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await logoutCommand({ json: true })
		consoleSpy.mockRestore()

		expect(hasTokens()).toBe(false)
	})
})
