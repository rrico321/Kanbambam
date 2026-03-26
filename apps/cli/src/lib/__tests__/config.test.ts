import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearTokens, config, hasTokens } from '../config.js'

describe('config', () => {
	beforeEach(() => {
		config.clear()
	})

	afterEach(() => {
		config.clear()
	})

	it('stores and retrieves accessToken', () => {
		config.set('accessToken', 'tok_123')
		expect(config.get('accessToken')).toBe('tok_123')
	})

	it('returns default apiBaseUrl', () => {
		expect(config.get('apiBaseUrl')).toBe('http://localhost:3000')
	})

	it('clearTokens removes accessToken and refreshToken', () => {
		config.set('accessToken', 'tok_123')
		config.set('refreshToken', 'rt_456')
		clearTokens()
		expect(config.get('accessToken')).toBeUndefined()
		expect(config.get('refreshToken')).toBeUndefined()
	})

	it('hasTokens returns true when both tokens are set', () => {
		config.set('accessToken', 'tok_123')
		config.set('refreshToken', 'rt_456')
		expect(hasTokens()).toBe(true)
	})

	it('hasTokens returns false when tokens are missing', () => {
		expect(hasTokens()).toBe(false)
		config.set('accessToken', 'tok_123')
		expect(hasTokens()).toBe(false)
	})
})
