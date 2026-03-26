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

describe('itemShowCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	it('shows full item detail in JSON mode', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)

		mockApiRequest.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					id: 'itm_789',
					title: 'Deploy to production',
					description: 'Final deployment checklist',
					columnId: 'col_done',
					position: 'a0',
					dueDate: '2026-06-15T00:00:00Z',
					labels: ['deploy', 'critical'],
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-15T00:00:00Z',
				},
				meta: {},
			}),
		} as unknown as Response)

		const { itemShowCommand } = await import('../show.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemShowCommand('itm_789', { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_789')

		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Deploy to production')
		expect(output).toContain('Final deployment checklist')
		expect(output).toContain('deploy')
		expect(output).toContain('critical')
		expect(output).toContain('2026-06-15')

		consoleSpy.mockRestore()
	})
})
