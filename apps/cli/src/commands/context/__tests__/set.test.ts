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

describe('contextSetCommand', () => {
	beforeEach(() => {
		config.clear()
		config.set('accessToken', 'test_token')
		config.set('refreshToken', 'test_refresh')
	})

	afterEach(() => {
		config.clear()
		vi.restoreAllMocks()
	})

	it('sets workspace context from API response', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { contextSetCommand } = await import('../set.js')

		vi.mocked(apiRequest).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: { id: 'wks_abc', name: 'Test Workspace', userId: 'usr_1', createdAt: '', updatedAt: '' },
				meta: {},
			}),
		} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextSetCommand({ workspace: 'wks_abc' }, {})
		consoleSpy.mockRestore()

		const activeWorkspace = config.get('activeWorkspace')
		expect(activeWorkspace).toEqual({ id: 'wks_abc', name: 'Test Workspace' })
	})

	it('sets board context and auto-sets parent workspace (D-05)', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { contextSetCommand } = await import('../set.js')

		vi.mocked(apiRequest)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: { id: 'brd_def', name: 'Sprint Board', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
					meta: {},
				}),
			} as unknown as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: { id: 'wks_abc', name: 'Auto Workspace', userId: 'usr_1', createdAt: '', updatedAt: '' },
					meta: {},
				}),
			} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextSetCommand({ board: 'brd_def' }, {})
		consoleSpy.mockRestore()

		const activeBoard = config.get('activeBoard')
		const activeWorkspace = config.get('activeWorkspace')
		expect(activeBoard).toEqual({ id: 'brd_def', name: 'Sprint Board' })
		expect(activeWorkspace).toEqual({ id: 'wks_abc', name: 'Auto Workspace' })
	})

	it('errors when neither --workspace nor --board provided', async () => {
		const { contextSetCommand } = await import('../set.js')

		await expect(contextSetCommand({}, {})).rejects.toThrow(
			'Provide at least one of --workspace or --board.',
		)
	})
})
