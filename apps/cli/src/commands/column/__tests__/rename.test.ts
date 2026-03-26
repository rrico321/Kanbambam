import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock ink to avoid yoga-layout WASM loading in tests
vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

vi.mock('../../../lib/api-client.js', () => ({
	apiRequest: vi.fn(),
}))

describe('columnRenameCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('calls PATCH /api/v1/columns/{id} with new name', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_abc', name: 'In Review', boardId: 'brd_1', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		const { columnRenameCommand } = await import('../rename.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnRenameCommand('col_abc', { name: 'In Review' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc', {
			method: 'PATCH',
			body: JSON.stringify({ name: 'In Review' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('In Review')
		expect(output).toContain('col_abc')
		consoleSpy.mockRestore()
	})

	it('errors when --name not provided', async () => {
		const { columnRenameCommand } = await import('../rename.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnRenameCommand('col_abc', {}, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Name is required')
		consoleSpy.mockRestore()
	})
})
