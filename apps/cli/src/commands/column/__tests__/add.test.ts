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

vi.mock('../../../lib/config.js', () => ({
	config: {
		get: vi.fn(),
		set: vi.fn(),
		clear: vi.fn(),
		delete: vi.fn(),
	},
}))

describe('columnAddCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('calls POST /api/v1/boards/{boardId}/columns with name', async () => {
		const { config } = await import('../../../lib/config.js')
		const mockConfig = vi.mocked(config)
		mockConfig.get.mockImplementation((key: string) => {
			if (key === 'activeBoard') return { id: 'brd_abc', name: 'My Board' }
			return undefined
		})

		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 201,
			json: async () => ({
				data: { id: 'col_123', name: 'Done', boardId: 'brd_abc', position: 'a2', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: { requestId: 'req_1' },
			}),
		} as unknown as Response)

		const { columnAddCommand } = await import('../add.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnAddCommand('Done', {}, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/boards/brd_abc/columns', {
			method: 'POST',
			body: JSON.stringify({ name: 'Done' }),
		})

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('col_123')
		expect(output).toContain('Done')
		consoleSpy.mockRestore()
	})

	it('resolves board from --board flag', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValue({
			ok: true,
			status: 201,
			json: async () => ({
				data: { id: 'col_456', name: 'To Do', boardId: 'brd_xyz', position: 'a0', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
				meta: {},
			}),
		} as unknown as Response)

		const { columnAddCommand } = await import('../add.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnAddCommand('To Do', { board: 'brd_xyz' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/boards/brd_xyz/columns', {
			method: 'POST',
			body: JSON.stringify({ name: 'To Do' }),
		})
		consoleSpy.mockRestore()
	})

	it('errors when no board context', async () => {
		const { config } = await import('../../../lib/config.js')
		const mockConfig = vi.mocked(config)
		mockConfig.get.mockReturnValue(undefined)

		const { columnAddCommand } = await import('../add.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await columnAddCommand('Done', {}, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('board')
		consoleSpy.mockRestore()
	})
})
