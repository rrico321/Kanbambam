import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectOutputMode, formatJson } from '../output.js'

describe('output', () => {
	describe('detectOutputMode', () => {
		const originalIsTTY = process.stdout.isTTY

		afterEach(() => {
			Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true })
		})

		it('returns json when json flag is true', () => {
			expect(detectOutputMode({ json: true })).toBe('json')
		})

		it('returns ink when stdout is TTY and json is false', () => {
			Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true })
			expect(detectOutputMode({ json: false })).toBe('ink')
		})

		it('returns plain when stdout is not TTY and json is false', () => {
			Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true })
			expect(detectOutputMode({ json: false })).toBe('plain')
		})
	})

	describe('formatJson', () => {
		it('outputs valid JSON matching envelope format', () => {
			const result = formatJson({ id: 1 }, { requestId: 'abc' })
			const parsed = JSON.parse(result)
			expect(parsed).toEqual({
				data: { id: 1 },
				meta: { requestId: 'abc' },
			})
		})

		it('defaults to empty meta object', () => {
			const result = formatJson({ id: 1 })
			const parsed = JSON.parse(result)
			expect(parsed.meta).toEqual({})
		})
	})
})
