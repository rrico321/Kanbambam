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

vi.mock('fractional-indexing', () => ({
	generateKeyBetween: vi.fn().mockReturnValue('a0V'),
}))

describe('columnReorderCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('fetches column and all board columns, then PATCHes with new position', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// Call 1: GET column by ID
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_2', name: 'In Progress', boardId: 'brd_abc', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// Call 2: GET all columns for board
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'col_1', name: 'To Do', boardId: 'brd_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_2', name: 'In Progress', boardId: 'brd_abc', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_3', name: 'Done', boardId: 'brd_abc', position: 'a2', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 3, cursor: null },
			}),
		} as unknown as Response)

		// Call 3: PATCH column with new position
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_2', name: 'In Progress', boardId: 'brd_abc', position: 'a0V', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		const { columnReorderCommand } = await import('../reorder.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnReorderCommand('col_2', { position: '1' }, { json: true })

		// Verify GET column
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_2')
		// Verify GET all columns
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/boards/brd_abc/columns?limit=100')
		// Verify PATCH with position
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_2', {
			method: 'PATCH',
			body: expect.stringContaining('position'),
		})

		consoleSpy.mockRestore()
	})

	it('errors when position out of range', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_1', name: 'To Do', boardId: 'brd_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET all columns
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'col_1', name: 'To Do', boardId: 'brd_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_2', name: 'In Progress', boardId: 'brd_abc', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_3', name: 'Done', boardId: 'brd_abc', position: 'a2', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 3, cursor: null },
			}),
		} as unknown as Response)

		const { columnReorderCommand } = await import('../reorder.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnReorderCommand('col_1', { position: '5' }, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Position must be between 1 and 3')
		consoleSpy.mockRestore()
	})

	it('translates position 2 to fractional index between columns', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const { generateKeyBetween } = await import('fractional-indexing')
		const mockGenerate = vi.mocked(generateKeyBetween)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_3', name: 'Done', boardId: 'brd_abc', position: 'a2', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET all columns (col_3 is being moved, remaining are col_1, col_2)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'col_1', name: 'To Do', boardId: 'brd_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_2', name: 'In Progress', boardId: 'brd_abc', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'col_3', name: 'Done', boardId: 'brd_abc', position: 'a2', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 3, cursor: null },
			}),
		} as unknown as Response)

		// PATCH
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_3', name: 'Done', boardId: 'brd_abc', position: 'a0V', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		const { columnReorderCommand } = await import('../reorder.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnReorderCommand('col_3', { position: '2' }, { json: true })

		// Position 2 means between remaining[0] (a0) and remaining[1] (a1)
		expect(mockGenerate).toHaveBeenCalledWith('a0', 'a1')
		consoleSpy.mockRestore()
	})
})
