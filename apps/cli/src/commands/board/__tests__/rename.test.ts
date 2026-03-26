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

describe('boardRenameCommand', () => {
	beforeEach(() => {
		config.clear()
		config.set('accessToken', 'test_token')
		config.set('refreshToken', 'test_refresh')
	})

	afterEach(() => {
		config.clear()
		vi.restoreAllMocks()
	})

	it('calls PATCH /api/v1/boards/{id} with new name', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const { boardRenameCommand } = await import('../rename.js')

		vi.mocked(apiRequest).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: { id: 'brd_123', name: 'New Name', workspaceId: 'wks_abc', createdAt: '', updatedAt: '' },
				meta: {},
			}),
		} as unknown as Response)

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await boardRenameCommand('brd_123', { name: 'New Name' }, { json: true })

		expect(apiRequest).toHaveBeenCalledWith('/api/v1/boards/brd_123', {
			method: 'PATCH',
			body: JSON.stringify({ name: 'New Name' }),
		})

		const output = consoleSpy.mock.calls[0]?.[0] as string
		const parsed = JSON.parse(output)
		expect(parsed.data.name).toBe('New Name')
		consoleSpy.mockRestore()
	})

	it('errors when --name not provided', async () => {
		const { boardRenameCommand } = await import('../rename.js')

		await expect(boardRenameCommand('brd_123', {}, {})).rejects.toThrow(
			'Name is required. Use --name <new-name>',
		)
	})
})
