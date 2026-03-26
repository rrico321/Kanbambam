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

describe('itemReorderCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('fetches item and all column items, then POSTs move with new position', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// Call 1: GET item by ID
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_2',
					title: 'Second task',
					description: null,
					columnId: 'col_abc',
					position: 'a1',
					dueDate: null,
					labels: null,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		// Call 2: GET all items in column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'itm_1', title: 'First task', description: null, columnId: 'col_abc', position: 'a0', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_2', title: 'Second task', description: null, columnId: 'col_abc', position: 'a1', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_3', title: 'Third task', description: null, columnId: 'col_abc', position: 'a2', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 3, cursor: null },
			}),
		} as unknown as Response)

		// Call 3: POST move with new position
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_2',
					title: 'Second task',
					description: null,
					columnId: 'col_abc',
					position: 'a0V',
					dueDate: null,
					labels: null,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		const { itemReorderCommand } = await import('../reorder.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemReorderCommand('itm_2', { position: '1' }, { json: true })

		// Verify GET item
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_2')
		// Verify GET all items in column
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc/items?limit=100')
		// Verify POST move with position
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_2/move', {
			method: 'POST',
			body: expect.stringContaining('columnId'),
		})

		consoleSpy.mockRestore()
	})

	it('errors when position out of range', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// GET item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_1',
					title: 'First task',
					description: null,
					columnId: 'col_abc',
					position: 'a0',
					dueDate: null,
					labels: null,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		// GET all items in column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'itm_1', title: 'First task', description: null, columnId: 'col_abc', position: 'a0', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_2', title: 'Second task', description: null, columnId: 'col_abc', position: 'a1', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_3', title: 'Third task', description: null, columnId: 'col_abc', position: 'a2', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 3, cursor: null },
			}),
		} as unknown as Response)

		const { itemReorderCommand } = await import('../reorder.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemReorderCommand('itm_1', { position: '5' }, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Position must be between 1 and 3')
		consoleSpy.mockRestore()
	})

	it('translates position to fractional index between items', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const { generateKeyBetween } = await import('fractional-indexing')
		const mockGenerate = vi.mocked(generateKeyBetween)

		// GET item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_3',
					title: 'Third task',
					description: null,
					columnId: 'col_abc',
					position: 'a2',
					dueDate: null,
					labels: null,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		// GET all items (itm_3 is being moved, remaining are itm_1, itm_2)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'itm_1', title: 'First task', description: null, columnId: 'col_abc', position: 'a0', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_2', title: 'Second task', description: null, columnId: 'col_abc', position: 'a1', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_3', title: 'Third task', description: null, columnId: 'col_abc', position: 'a2', dueDate: null, labels: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 3, cursor: null },
			}),
		} as unknown as Response)

		// POST move
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_3',
					title: 'Third task',
					description: null,
					columnId: 'col_abc',
					position: 'a0V',
					dueDate: null,
					labels: null,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		const { itemReorderCommand } = await import('../reorder.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemReorderCommand('itm_3', { position: '2' }, { json: true })

		// Position 2 means between remaining[0] (a0) and remaining[1] (a1)
		expect(mockGenerate).toHaveBeenCalledWith('a0', 'a1')
		consoleSpy.mockRestore()
	})
})
