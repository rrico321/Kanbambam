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

describe('itemDeleteCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	const mockItem = {
		id: 'itm_abc',
		title: 'Test Item',
		description: null,
		columnId: 'col_1',
		position: 'a0',
		dueDate: null,
		labels: null,
		createdAt: '2026-01-01',
		updatedAt: '2026-01-01',
	}

	it('deletes item with --force, no confirmation', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { confirm } = await import('../../../lib/confirm.js')
		const mockApiRequest = vi.mocked(apiRequest)

		// GET item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ data: mockItem, meta: {} }),
		} as unknown as Response)

		// DELETE item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({}),
		} as unknown as Response)

		const { itemDeleteCommand } = await import('../delete.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemDeleteCommand('itm_abc', { force: true }, { json: true })

		expect(confirm).not.toHaveBeenCalled()
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc')
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', { method: 'DELETE' })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('deleted')
		consoleSpy.mockRestore()
	})

	it('prompts for confirmation without --force', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { confirm } = await import('../../../lib/confirm.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockConfirm = vi.mocked(confirm)

		// GET item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ data: mockItem, meta: {} }),
		} as unknown as Response)

		mockConfirm.mockResolvedValueOnce(true)

		// DELETE item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({}),
		} as unknown as Response)

		const { itemDeleteCommand } = await import('../delete.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemDeleteCommand('itm_abc', {}, { json: true })

		expect(mockConfirm).toHaveBeenCalledWith('Delete item "Test Item"? [y/N]')
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', { method: 'DELETE' })
		consoleSpy.mockRestore()
	})

	it('cancels when user declines confirmation', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { confirm } = await import('../../../lib/confirm.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockConfirm = vi.mocked(confirm)

		// GET item
		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ data: mockItem, meta: {} }),
		} as unknown as Response)

		mockConfirm.mockResolvedValueOnce(false)

		const { itemDeleteCommand } = await import('../delete.js')
		await itemDeleteCommand('itm_abc', {}, { json: true })

		// DELETE should never be called
		expect(mockApiRequest).toHaveBeenCalledTimes(1) // only the GET
		expect(mockApiRequest).not.toHaveBeenCalledWith('/api/v1/items/itm_abc', { method: 'DELETE' })
	})

	it('handles 404 error', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		mockApiRequest.mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({ error: { code: 'NOT_FOUND', message: 'Item not found' } }),
		} as unknown as Response)

		const { itemDeleteCommand } = await import('../delete.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemDeleteCommand('itm_abc', { force: true }, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Item not found')
		consoleSpy.mockRestore()
	})
})
