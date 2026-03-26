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
		resolveColumnId: vi.fn(),
	}
})

describe('itemListCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('lists items in table format', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { resolveColumnId } = await import('../../../lib/context.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockResolveColumnId = vi.mocked(resolveColumnId)

		mockResolveColumnId.mockReturnValue('col_abc')

		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [
					{
						id: 'itm_001',
						title: 'First item',
						description: null,
						columnId: 'col_abc',
						position: 'a0',
						dueDate: '2026-12-31T00:00:00Z',
						labels: ['bug', 'urgent'],
						createdAt: '2026-01-01T00:00:00Z',
						updatedAt: '2026-01-01T00:00:00Z',
					},
					{
						id: 'itm_002',
						title: 'Second item',
						description: 'A description',
						columnId: 'col_abc',
						position: 'a1',
						dueDate: null,
						labels: null,
						createdAt: '2026-01-01T00:00:00Z',
						updatedAt: '2026-01-01T00:00:00Z',
					},
				],
				meta: { total: 2, cursor: null },
			}),
		} as unknown as Response)

		const { itemListCommand } = await import('../list.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemListCommand({ column: 'col_abc' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc/items?limit=50')

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('itm_001')
		expect(output).toContain('First item')
		expect(output).toContain('itm_002')
		expect(output).toContain('Second item')

		consoleSpy.mockRestore()
	})

	it('shows empty state when no items', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { resolveColumnId } = await import('../../../lib/context.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockResolveColumnId = vi.mocked(resolveColumnId)

		mockResolveColumnId.mockReturnValue('col_abc')

		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: [],
				meta: { total: 0, cursor: null },
			}),
		} as unknown as Response)

		const { itemListCommand } = await import('../list.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemListCommand({ column: 'col_abc' }, { json: true })

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('[]')

		consoleSpy.mockRestore()
	})
})
