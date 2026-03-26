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

describe('workspaceRenameCommand', () => {
	beforeEach(() => {
		config.clear()
		vi.resetModules()
	})

	afterEach(() => {
		config.clear()
	})

	it('calls PATCH /api/v1/workspaces/{id} with new name', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'wks_abc', name: 'New Name', userId: 'usr_1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: { requestId: 'req_1' },
			}),
		} as unknown as Response)

		const { workspaceRenameCommand } = await import('../rename.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceRenameCommand('wks_abc', { name: 'New Name' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/workspaces/wks_abc', {
			method: 'PATCH',
			body: JSON.stringify({ name: 'New Name' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('New Name')
		consoleSpy.mockRestore()
	})

	it('errors when --name not provided', async () => {
		const { workspaceRenameCommand } = await import('../rename.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await workspaceRenameCommand('wks_abc', {}, { json: true })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('MISSING_OPTION')
		expect(process.exitCode).toBe(1)
		consoleSpy.mockRestore()
		process.exitCode = undefined as unknown as number
	})
})
