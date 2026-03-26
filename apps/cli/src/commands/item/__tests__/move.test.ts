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

describe('itemMoveCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('moves item to target column', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_123',
					title: 'Fix login bug',
					description: null,
					columnId: 'col_target',
					position: 'a0',
					dueDate: null,
					labels: null,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		const { itemMoveCommand } = await import('../move.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemMoveCommand('itm_123', { to: 'col_target' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_123/move', {
			method: 'POST',
			body: JSON.stringify({ columnId: 'col_target' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('itm_123')
		expect(output).toContain('Fix login bug')

		consoleSpy.mockRestore()
	})

	it('errors when --to flag missing', async () => {
		const { itemMoveCommand } = await import('../move.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemMoveCommand('itm_123', {}, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('No target column')

		consoleSpy.mockRestore()
	})

	it('handles 404 error', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		mockApiRequest.mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({
				error: { code: 'NOT_FOUND', message: 'Item not found' },
			}),
		} as unknown as Response)

		const { itemMoveCommand } = await import('../move.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemMoveCommand('itm_999', { to: 'col_target' }, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('NOT_FOUND')

		consoleSpy.mockRestore()
	})
})
