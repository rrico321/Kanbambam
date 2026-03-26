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

describe('itemEditCommand', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	afterEach(() => {
		process.exitCode = undefined as unknown as number
	})

	function mockSuccessResponse(data: Record<string, unknown> = {}) {
		const defaults = {
			id: 'itm_abc',
			title: 'Test Item',
			description: null,
			columnId: 'col_1',
			position: 'a0',
			dueDate: null,
			labels: null,
			createdAt: '2026-01-01',
			updatedAt: '2026-01-01',
			...data,
		}
		return {
			ok: true,
			status: 200,
			json: async () => ({ data: defaults, meta: {} }),
		} as unknown as Response
	}

	it('sends PATCH with title only', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse({ title: 'New Title' }))

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { title: 'New Title' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ title: 'New Title' }),
		})
		consoleSpy.mockRestore()
	})

	it('sends PATCH with description', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse({ description: 'A desc' }))

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { description: 'A desc' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ description: 'A desc' }),
		})
		consoleSpy.mockRestore()
	})

	it('clears description with empty string', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse())

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { description: '' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ description: null }),
		})
		consoleSpy.mockRestore()
	})

	it('sets labels with replace-all', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse({ labels: ['bug', 'urgent'] }))

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { label: ['bug', 'urgent'] }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ labels: ['bug', 'urgent'] }),
		})
		consoleSpy.mockRestore()
	})

	it('clears labels with empty string', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse())

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { label: [''] }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ labels: null }),
		})
		consoleSpy.mockRestore()
	})

	it('sets due date', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse({ dueDate: '2026-04-01' }))

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { dueDate: '2026-04-01' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ dueDate: '2026-04-01' }),
		})
		consoleSpy.mockRestore()
	})

	it('clears due date with empty string', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse())

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { dueDate: '' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ dueDate: null }),
		})
		consoleSpy.mockRestore()
	})

	it('errors when no flags provided', async () => {
		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', {}, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('No changes specified')
		consoleSpy.mockRestore()
	})

	it('errors on invalid date format', async () => {
		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { dueDate: 'tomorrow' }, { json: true })

		expect(process.exitCode).toBe(1)
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('Invalid date format')
		consoleSpy.mockRestore()
	})

	it('combines multiple flags in single PATCH', async () => {
		const { apiRequest } = await import('../../../lib/api-client.js')
		const mockApiRequest = vi.mocked(apiRequest)
		mockApiRequest.mockResolvedValueOnce(mockSuccessResponse({ title: 'X', labels: ['a'], dueDate: '2026-05-01' }))

		const { itemEditCommand } = await import('../edit.js')
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await itemEditCommand('itm_abc', { title: 'X', label: ['a'], dueDate: '2026-05-01' }, { json: true })

		expect(mockApiRequest).toHaveBeenCalledTimes(1)
		expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc', {
			method: 'PATCH',
			body: JSON.stringify({ title: 'X', labels: ['a'], dueDate: '2026-05-01' }),
		})
		consoleSpy.mockRestore()
	})
})
