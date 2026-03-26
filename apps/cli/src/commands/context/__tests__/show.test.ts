import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../lib/config.js'

vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

describe('contextShowCommand', () => {
	beforeEach(() => {
		config.clear()
	})

	afterEach(() => {
		config.clear()
	})

	it('shows (not set) when no context is configured', async () => {
		const { contextShowCommand } = await import('../show.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextShowCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('(not set)')
	})

	it('shows workspace and board when context is set', async () => {
		const { contextShowCommand } = await import('../show.js')

		config.set('activeWorkspace', { id: 'wks_123', name: 'My Workspace' })
		config.set('activeBoard', { id: 'brd_456', name: 'Sprint Board' })

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextShowCommand({})
		const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n')
		consoleSpy.mockRestore()

		expect(output).toContain('My Workspace')
		expect(output).toContain('Sprint Board')
	})

	it('outputs JSON when --json flag is set', async () => {
		const { contextShowCommand } = await import('../show.js')

		config.set('activeWorkspace', { id: 'wks_123', name: 'My Workspace' })

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await contextShowCommand({ json: true })

		const jsonCall = consoleSpy.mock.calls.find((call) => {
			try {
				const parsed = JSON.parse(call[0] as string)
				return parsed.data?.workspace?.id === 'wks_123'
			} catch {
				return false
			}
		})
		consoleSpy.mockRestore()

		expect(jsonCall).toBeTruthy()
	})
})
