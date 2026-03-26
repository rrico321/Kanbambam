import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../lib/config.js'

vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

describe('contextClearCommand', () => {
	beforeEach(() => {
		config.clear()
	})

	afterEach(() => {
		config.clear()
	})

	it('clears workspace and board from config', async () => {
		const { contextClearCommand } = await import('../clear.js')

		config.set('activeWorkspace', { id: 'wks_123', name: 'My Workspace' })
		config.set('activeBoard', { id: 'brd_456', name: 'Sprint Board' })

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextClearCommand({})
		consoleSpy.mockRestore()

		expect(config.get('activeWorkspace')).toBeUndefined()
		expect(config.get('activeBoard')).toBeUndefined()
	})

	it('outputs Context cleared success message', async () => {
		const { contextClearCommand } = await import('../clear.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextClearCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('Context cleared')
	})
})
