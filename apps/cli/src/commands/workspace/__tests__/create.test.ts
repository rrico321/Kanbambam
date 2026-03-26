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

describe('workspaceCreateCommand', () => {
	beforeEach(() => {
		config.clear()
		vi.resetModules()
	})

	afterEach(() => {
		config.clear()
	})

	it('calls POST /api/v1/workspaces with name and outputs success', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 201,
			json: async () => ({
				data: { id: 'wks_abc', name: 'Test', userId: 'usr_1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: { requestId: 'req_1' },
			}),
		} as unknown as Response)

		const { workspaceCreateCommand } = await import('../create.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceCreateCommand('Test', { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/workspaces', {
			method: 'POST',
			body: JSON.stringify({ name: 'Test' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('wks_abc')
		consoleSpy.mockRestore()
	})

	it('handles API error response', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({
				error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
			}),
		} as unknown as Response)

		const { workspaceCreateCommand } = await import('../create.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceCreateCommand('', { json: true })

		expect(process.exitCode).toBe(1)
		consoleSpy.mockRestore()
		process.exitCode = undefined as unknown as number
	})
})
