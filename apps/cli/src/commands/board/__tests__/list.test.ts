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

describe('boardListCommand', () => {
	beforeEach(() => {
		config.clear()
		config.set('accessToken', 'test_token')
		config.set('refreshToken', 'test_refresh')
	})

	afterEach(() => {
		config.clear()
		vi.restoreAllMocks()
	})

	it('lists boards in JSON mode', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardListCommand } = await import('../list.js')

		vi.mocked(apiRequest).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: [
					{ id: 'brd_1', name: 'Board One', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
					{ id: 'brd_2', name: 'Board Two', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
				],
				meta: { total: 2, cursor: null },
			}),
		} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardListCommand({ workspace: 'wks_abc' }, { json: true })

		const output = consoleSpy.mock.calls[0]?.[0] as string
		const parsed = JSON.parse(output)
		expect(parsed.data).toHaveLength(2)
		expect(parsed.data[0].name).toBe('Board One')
		expect(parsed.meta.total).toBe(2)
		consoleSpy.mockRestore()
	})

	it('shows empty state when no boards', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardListCommand } = await import('../list.js')

		vi.mocked(apiRequest).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: [],
				meta: { total: 0, cursor: null },
			}),
		} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardListCommand({ workspace: 'wks_abc' }, { json: true })

		const output = consoleSpy.mock.calls[0]?.[0] as string
		const parsed = JSON.parse(output)
		expect(parsed.data).toEqual([])
		consoleSpy.mockRestore()
	})

	it('resolves workspace from --workspace flag', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardListCommand } = await import('../list.js')

		vi.mocked(apiRequest).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: [],
				meta: { total: 0, cursor: null },
			}),
		} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardListCommand({ workspace: 'wks_specific' }, { json: true })
		consoleSpy.mockRestore()

		expect(apiRequest).toHaveBeenCalledWith('/api/v1/workspaces/wks_specific/boards?limit=50')
	})
})
