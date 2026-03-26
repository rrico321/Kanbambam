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

vi.mock('../../../lib/confirm.js', () => ({
	confirm: vi.fn(),
}))

describe('columnDeleteCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('deletes empty column without confirmation', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const { confirm } = await import('../../../lib/confirm.js')
		const mockConfirm = vi.mocked(confirm)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_abc', name: 'Empty Col', boardId: 'brd_1', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET items (empty)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [],
				meta: { total: 0, cursor: null },
			}),
		} as unknown as Response)

		// DELETE column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 204,
			json: async () => ({}),
		} as unknown as Response)

		const { columnDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnDeleteCommand('col_abc', {}, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc', { method: 'DELETE' })
		expect(mockConfirm).not.toHaveBeenCalled()

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('deleted')
		consoleSpy.mockRestore()
	})

	it('errors when column has items and no --force or --move-to', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_abc', name: 'Busy Col', boardId: 'brd_1', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET items (3 items)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [{ id: 'itm_1', title: 'Item 1', columnId: 'col_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
				meta: { total: 3, cursor: 'next' },
			}),
		} as unknown as Response)

		const { columnDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnDeleteCommand('col_abc', {}, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('has 3 items. Use --move-to')
		consoleSpy.mockRestore()
	})

	it('moves items to target column when --move-to provided', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_src', name: 'Source', boardId: 'brd_1', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET items (check - has items)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [{ id: 'itm_1', title: 'Item 1', columnId: 'col_src', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
				meta: { total: 2, cursor: 'next' },
			}),
		} as unknown as Response)

		// GET all items (for move)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{ id: 'itm_1', title: 'Item 1', columnId: 'col_src', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
					{ id: 'itm_2', title: 'Item 2', columnId: 'col_src', position: 'a1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				],
				meta: { total: 2, cursor: null },
			}),
		} as unknown as Response)

		// Move item 1
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ data: {}, meta: {} }),
		} as unknown as Response)

		// Move item 2
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ data: {}, meta: {} }),
		} as unknown as Response)

		// DELETE column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 204,
			json: async () => ({}),
		} as unknown as Response)

		const { columnDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnDeleteCommand('col_src', { moveTo: 'col_dest' }, { json: true })

		// Verify move API calls
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_1/move', {
			method: 'POST',
			body: JSON.stringify({ columnId: 'col_dest' }),
		})
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_2/move', {
			method: 'POST',
			body: JSON.stringify({ columnId: 'col_dest' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Moved 2 items')
		consoleSpy.mockRestore()
	})

	it('confirms before deleting column with items when --force', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const { confirm } = await import('../../../lib/confirm.js')
		const mockConfirm = vi.mocked(confirm)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_abc', name: 'Force Col', boardId: 'brd_1', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET items (2 items)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [{ id: 'itm_1', title: 'Item 1', columnId: 'col_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
				meta: { total: 2, cursor: 'next' },
			}),
		} as unknown as Response)

		mockConfirm.mockResolvedValue(true)

		// DELETE
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 204,
			json: async () => ({}),
		} as unknown as Response)

		const { columnDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnDeleteCommand('col_abc', { force: true }, { json: true })

		expect(mockConfirm).toHaveBeenCalled()
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc', { method: 'DELETE' })
		consoleSpy.mockRestore()
	})

	it('does not delete when --force confirmation declined', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const { confirm } = await import('../../../lib/confirm.js')
		const mockConfirm = vi.mocked(confirm)

		// GET column
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'col_abc', name: 'Keep Col', boardId: 'brd_1', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		// GET items (2 items)
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [{ id: 'itm_1', title: 'Item 1', columnId: 'col_abc', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
				meta: { total: 2, cursor: 'next' },
			}),
		} as unknown as Response)

		mockConfirm.mockResolvedValue(false)

		const { columnDeleteCommand } = await import('../delete.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnDeleteCommand('col_abc', { force: true }, { json: true })

		// Should only have GET column + GET items calls, no DELETE
		expect(mockApiRequest).toHaveBeenCalledTimes(2)
		consoleSpy.mockRestore()
	})
})
