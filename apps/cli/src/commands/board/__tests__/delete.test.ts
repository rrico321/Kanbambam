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

vi.mock('../../../lib/confirm.js', () => ({
	confirm: vi.fn(),
}))

describe('boardDeleteCommand', () => {
	beforeEach(() => {
		config.clear()
		config.set('accessToken', 'test_token')
		config.set('refreshToken', 'test_refresh')
	})

	afterEach(() => {
		config.clear()
		vi.restoreAllMocks()
	})

	it('deletes board when --force set', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardDeleteCommand } = await import('../delete.js')

		vi.mocked(apiRequest)
			// GET board
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					data: { id: 'brd_123', name: 'My Board', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
					meta: {},
				}),
			} as unknown as Response)
			// DELETE board
			.mockResolvedValueOnce({
				ok: true,
				status: 204,
			} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardDeleteCommand('brd_123', { force: true }, { json: true })

		expect(apiRequest).toHaveBeenCalledTimes(2)
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/v1/boards/brd_123', { method: 'DELETE' })

		const output = consoleSpy.mock.calls[0]?.[0] as string
		const parsed = JSON.parse(output)
		expect(parsed.data.deleted).toBe(true)
		consoleSpy.mockRestore()
	})

	it('does not delete when confirmation declined', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { confirm } = await import('../../../lib/confirm.js')
		const { boardDeleteCommand } = await import('../delete.js')

		vi.mocked(apiRequest).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'brd_123', name: 'My Board', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
				meta: {},
			}),
		} as unknown as Response)

		vi.mocked(confirm).mockResolvedValueOnce(false)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardDeleteCommand('brd_123', {}, { json: true })

		// Only GET call, no DELETE
		expect(apiRequest).toHaveBeenCalledTimes(1)

		const output = consoleSpy.mock.calls[0]?.[0] as string
		const parsed = JSON.parse(output)
		expect(parsed.data.deleted).toBe(false)
		consoleSpy.mockRestore()
	})
})
