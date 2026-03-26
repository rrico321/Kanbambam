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

vi.mock('../../../lib/confirm.js', () => ({
	confirm: vi.fn(),
}))

describe('workspaceDeleteCommand', () => {
	beforeEach(() => {
		config.clear()
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		config.clear()
	})

	it('calls DELETE /api/v1/workspaces/{id} when force flag set', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// First call: GET workspace
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'wks_abc', name: 'Test WS', userId: 'usr_1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// Second call: DELETE workspace
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 204,
			json: async () => ({}),
		} as unknown as Response)

		const { workspaceDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceDeleteCommand('wks_abc', { force: true }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/workspaces/wks_abc')
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/workspaces/wks_abc', { method: 'DELETE' })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('deleted')
		consoleSpy.mockRestore()
	})

	it('does not delete when confirmation declined', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// GET workspace
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'wks_abc', name: 'Test WS', userId: 'usr_1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		const { confirm } = await import('../../../lib/confirm.js')
		const mockConfirm = vi.mocked(confirm)
		mockConfirm.mockResolvedValue(false)

		const { workspaceDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceDeleteCommand('wks_abc', {}, { json: true })

		// Should only have the GET call, no DELETE
		expect(mockApiRequest).toHaveBeenCalledTimes(1)
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/workspaces/wks_abc')
		consoleSpy.mockRestore()
	})
})
