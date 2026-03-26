import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../lib/config.js'

// Mock ink to avoid yoga-layout WASM loading in tests
vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

describe('statusCommand', () => {
	beforeEach(() => {
		config.clear()
	})

	afterEach(() => {
		config.clear()
	})

	it('shows "Not logged in" when no tokens', async () => {
		const { statusCommand } = await import('../status.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await statusCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('Not logged in')
	})

	it('shows auth status when tokens present', async () => {
		const { statusCommand } = await import('../status.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await statusCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('Logged in')
	})

	it('--json outputs { data: { authenticated: false } } when not logged in', async () => {
		const { statusCommand } = await import('../status.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await statusCommand({ json: true })

		const jsonCall = consoleSpy.mock.calls.find((call) => {
			try {
				const parsed = JSON.parse(call[0] as string)
				return parsed.data?.authenticated === false
			} catch {
				return false
			}
		})
		consoleSpy.mockRestore()

		expect(jsonCall).toBeTruthy()
	})

	it('--json outputs { data: { authenticated: true } } when logged in', async () => {
		const { statusCommand } = await import('../status.js')

		config.set('accessToken', 'test_access')
		config.set('refreshToken', 'test_refresh')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await statusCommand({ json: true })

		const jsonCall = consoleSpy.mock.calls.find((call) => {
			try {
				const parsed = JSON.parse(call[0] as string)
				return parsed.data?.authenticated === true
			} catch {
				return false
			}
		})
		consoleSpy.mockRestore()

		expect(jsonCall).toBeTruthy()
	})
})
