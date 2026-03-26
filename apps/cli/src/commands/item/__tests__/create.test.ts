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

describe('itemCreateCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('creates item with title and outputs JSON', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { resolveColumnId } = await import('../../../lib/context.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockResolveColumnId = vi.mocked(resolveColumnId)

		mockResolveColumnId.mockReturnValue('col_abc')

		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: async () => ({
				data: {
					id: 'itm_123',
					title: 'Fix login bug',
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

		const { itemCreateCommand } = await import('../create.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemCreateCommand('Fix login bug', { column: 'col_abc' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc/items', {
			method: 'POST',
			body: JSON.stringify({ title: 'Fix login bug' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('itm_123')
		expect(output).toContain('Fix login bug')

		consoleSpy.mockRestore()
	})

	it('includes description when --description flag provided', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { resolveColumnId } = await import('../../../lib/context.js')
		const mockApiRequest = vi.mocked(apiRequest)
		const mockResolveColumnId = vi.mocked(resolveColumnId)

		mockResolveColumnId.mockReturnValue('col_abc')

		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: async () => ({
				data: {
					id: 'itm_456',
					title: 'Add tests',
					description: 'Write unit tests for auth module',
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

		const { itemCreateCommand } = await import('../create.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemCreateCommand('Add tests', { column: 'col_abc', description: 'Write unit tests for auth module' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/columns/col_abc/items', {
			method: 'POST',
			body: JSON.stringify({ title: 'Add tests', description: 'Write unit tests for auth module' }),
		})

		consoleSpy.mockRestore()
	})

	it('errors when no column specified', async () => {
		const { resolveColumnId } = await import('../../../lib/context.js')
		const mockResolveColumnId = vi.mocked(resolveColumnId)

		mockResolveColumnId.mockImplementation(() => {
			throw new Error('No column specified. Use --column <id>. List columns with: kanbambam column list')
		})

		const { itemCreateCommand } = await import('../create.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemCreateCommand('Some item', {}, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('No column specified')

		consoleSpy.mockRestore()
	})
})
