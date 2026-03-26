import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../lib/config.js'

// Mock ink to avoid yoga-layout WASM loading in tests
vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

vi.mock('../../../lib/api-client.js', () => ({
	apiRequest: vi.fn(),
}))

describe('workspaceListCommand', () => {
	beforeEach(() => {
		config.clear()
		vi.resetModules()
	})

	afterEach(() => {
		config.clear()
	})

	it('renders workspace data in JSON mode', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'wks_abc', name: 'WS1', userId: 'usr_1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 1, cursor: null },
			}),
		} as unknown as Response)

		const { workspaceListCommand } = await import('../list.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceListCommand({ json: true })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('wks_abc')
		consoleSpy.mockRestore()
	})

	it('shows empty state when no workspaces', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: [],
				meta: { total: 0, cursor: null },
			}),
		} as unknown as Response)

		const { workspaceListCommand } = await import('../list.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceListCommand({ json: true })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		const parsed = JSON.parse(output)
		expect(parsed.data).toEqual([])
		consoleSpy.mockRestore()
	})
})
