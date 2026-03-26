import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../lib/config.js'

vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

vi.mock('../../../lib/api-client.js', () => ({
	apiRequest: vi.fn(),
}))

describe('boardCreateCommand', () => {
	beforeEach(() => {
		config.clear()
		config.set('accessToken', 'test_token')
		config.set('refreshToken', 'test_refresh')
	})

	afterEach(() => {
		config.clear()
		vi.restoreAllMocks()
	})

	it('creates board and 3 default columns', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardCreateCommand } = await import('../create.js')

		vi.mocked(apiRequest)
			// Board create
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: { id: 'brd_123', name: 'Sprint Board', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
					meta: {},
				}),
			} as unknown as Response)
			// Column 1: To Do
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
			// Column 2: In Progress
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
			// Column 3: Done
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardCreateCommand('Sprint Board', { workspace: 'wks_abc' }, { json: true })

		expect(apiRequest).toHaveBeenCalledTimes(4)
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/v1/workspaces/wks_abc/boards', {
			method: 'POST',
			body: JSON.stringify({ name: 'Sprint Board' }),
		})
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/v1/boards/brd_123/columns', {
			method: 'POST',
			body: JSON.stringify({ name: 'To Do' }),
		})
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/api/v1/boards/brd_123/columns', {
			method: 'POST',
			body: JSON.stringify({ name: 'In Progress' }),
		})
		expect(apiRequest).toHaveBeenNthCalledWith(4, '/api/v1/boards/brd_123/columns', {
			method: 'POST',
			body: JSON.stringify({ name: 'Done' }),
		})

		const output = consoleSpy.mock.calls[0]?.[0] as string
		expect(output).toContain('brd_123')
		expect(output).toContain('To Do')
		consoleSpy.mockRestore()
	})

	it('resolves workspace from context when no --workspace flag', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardCreateCommand } = await import('../create.js')

		config.set('activeWorkspace', { id: 'wks_ctx', name: 'Ctx WS' })

		vi.mocked(apiRequest)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: { id: 'brd_456', name: 'Test', workspaceId: 'wks_ctx', createdAt: '', updatedAt: '' },
					meta: {},
				}),
			} as unknown as Response)
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardCreateCommand('Test', {}, { json: true })
		consoleSpy.mockRestore()

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/v1/workspaces/wks_ctx/boards', expect.any(Object))
	})

	it('shows partial success when column creation fails', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardCreateCommand } = await import('../create.js')

		vi.mocked(apiRequest)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: { id: 'brd_789', name: 'Partial', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
					meta: {},
				}),
			} as unknown as Response)
			// First column fails
			.mockResolvedValueOnce({ ok: false, json: async () => ({}) } as unknown as Response)
			// Others succeed
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardCreateCommand('Partial', { workspace: 'wks_abc' }, { json: true })

		const output = consoleSpy.mock.calls[0]?.[0] as string
		const parsed = JSON.parse(output)
		expect(parsed.meta.defaultColumns.failed).toContain('To Do')
		expect(parsed.meta.defaultColumns.created).toContain('In Progress')
		expect(parsed.meta.defaultColumns.created).toContain('Done')
		consoleSpy.mockRestore()
	})
})
