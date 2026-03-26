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

vi.mock('../../../lib/context.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../../lib/context.js')>()
	return {
		...actual,
		resolveBoardId: vi.fn(),
	}
})

describe('boardViewCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('fetches columns and items for board view in JSON mode', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { resolveBoardId } = await import('../../../lib/context.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockResolveBoardId = vi.mocked(resolveBoardId)

		mockResolveBoardId.mockReturnValue('brd_abc')

		// GET columns
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'col_1', name: 'To Do', boardId: 'brd_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_2', name: 'Done', boardId: 'brd_abc', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 2, cursor: null },
			}),
		} as unknown as Response)

		// GET items for col_1
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'itm_1', title: 'Task A', description: null, columnId: 'col_1', position: 'a0', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 1, cursor: null },
			}),
		} as unknown as Response)

		// GET items for col_2
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'itm_2', title: 'Task B', description: null, columnId: 'col_2', position: 'a0', dueDate: '2026-01-15T00:00:00Z', labels: ['bug'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 1, cursor: null },
			}),
		} as unknown as Response)

		const { boardViewCommand } = await import('../view.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardViewCommand({ board: 'brd_abc' }, { json: true })

		// Verify columns fetch
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/boards/brd_abc/columns?limit=100')
		// Verify items fetch for each column
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_1/items?limit=50')
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_2/items?limit=50')

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Task A')
		expect(output).toContain('Task B')
		expect(output).toContain('To Do')
		expect(output).toContain('Done')

		consoleSpy.mockRestore()
	})

	it('handles empty board', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { resolveBoardId } = await import('../../../lib/context.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockResolveBoardId = vi.mocked(resolveBoardId)

		mockResolveBoardId.mockReturnValue('brd_empty')

		// GET columns returns empty
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [],
				meta: { total: 0, cursor: null },
			}),
		} as unknown as Response)

		const { boardViewCommand } = await import('../view.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardViewCommand({ board: 'brd_empty' }, { json: true })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		// Should output valid JSON with empty array
		expect(output).toContain('[]')

		consoleSpy.mockRestore()
	})
})
