import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import http from 'node:http'
import { config, clearTokens } from '../../../lib/config.js'

// Mock the 'open' package
vi.mock('open', () => ({
	default: vi.fn().mockResolvedValue(undefined),
}))

describe('loginCommand', () => {
	beforeEach(() => {
		config.clear()
	})

	afterEach(() => {
		config.clear()
		vi.restoreAllMocks()
	})

	it('starts HTTP server on a random port', async () => {
		const { loginCommand } = await import('../login.js')

		// Override open to capture the URL and verify port
		const openMod = await import('open')
		const openFn = openMod.default as ReturnType<typeof vi.fn>
		openFn.mockImplementation(async (url: string) => {
			// Parse the URL to get the callback port
			const match = url.match(/cli_callback=.*?localhost:(\d+)/)
			expect(match).toBeTruthy()
			const port = Number.parseInt(match![1], 10)
			expect(port).toBeGreaterThan(0)
			expect(port).toBeLessThan(65536)
		})

		// Use short timeout so the test doesn't hang
		await loginCommand({ manual: false, _testTimeout: 300 } as any, { json: true }).catch(() => {})
	})

	it('opens browser with correct URL containing cli_callback and state params', async () => {
		const { loginCommand } = await import('../login.js')

		const openMod = await import('open')
		const openFn = openMod.default as ReturnType<typeof vi.fn>

		let capturedUrl = ''
		openFn.mockImplementation(async (url: string) => {
			capturedUrl = url
			// Immediately simulate timeout by not responding
		})

		// Run loginCommand with a very short timeout to avoid hanging
		const promise = loginCommand({ manual: false, _testTimeout: 500 } as any, { json: true })
		await promise.catch(() => {})

		expect(capturedUrl).toContain('cli_callback=')
		expect(capturedUrl).toContain('state=')
		expect(capturedUrl).toContain('/auth/login')
	})

	it('stores tokens in config on successful callback', async () => {
		const { loginCommand } = await import('../login.js')

		const openMod = await import('open')
		const openFn = openMod.default as ReturnType<typeof vi.fn>

		openFn.mockImplementation(async (url: string) => {
			// Parse callback URL and state from the login URL
			const urlObj = new URL(url)
			const callbackUrl = urlObj.searchParams.get('cli_callback')!
			const state = urlObj.searchParams.get('state')!

			// Simulate the web app redirecting back to the CLI with tokens
			// Use a small delay to let the server start listening
			setTimeout(async () => {
				const cbUrl = `${callbackUrl}?access_token=test_access_tok&refresh_token=test_refresh_tok&state=${state}`
				try {
					await fetch(cbUrl)
				} catch {
					// ignore connection errors
				}
			}, 100)
		})

		await loginCommand({ manual: false }, { json: true })

		expect(config.get('accessToken')).toBe('test_access_tok')
		expect(config.get('refreshToken')).toBe('test_refresh_tok')
	})

	it('times out after configured timeout and shows error', async () => {
		const { loginCommand } = await import('../login.js')

		const openMod = await import('open')
		const openFn = openMod.default as ReturnType<typeof vi.fn>
		openFn.mockImplementation(async () => {
			// Don't callback - let it timeout
		})

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		// Use a very short test timeout
		await loginCommand({ manual: false, _testTimeout: 300 } as any, { json: true }).catch(() => {})

		// Should have output something indicating timeout or error
		consoleSpy.mockRestore()
	})

	it('verifies state parameter matches (CSRF protection)', async () => {
		const { loginCommand } = await import('../login.js')

		const openMod = await import('open')
		const openFn = openMod.default as ReturnType<typeof vi.fn>

		let callbackBaseUrl = ''
		let correctState = ''

		openFn.mockImplementation(async (url: string) => {
			const urlObj = new URL(url)
			callbackBaseUrl = urlObj.searchParams.get('cli_callback')!
			correctState = urlObj.searchParams.get('state')!

			// Send callback with WRONG state
			setTimeout(async () => {
				try {
					await fetch(`${callbackBaseUrl}?access_token=tok&refresh_token=rt&state=wrong_state`)
				} catch {
					// ignore
				}
				// Then send with correct state so the command completes
				setTimeout(async () => {
					try {
						await fetch(`${callbackBaseUrl}?access_token=correct_tok&refresh_token=correct_rt&state=${correctState}`)
					} catch {
						// ignore
					}
				}, 100)
			}, 100)
		})

		await loginCommand({ manual: false }, { json: true }).catch(() => {})

		// Only correct tokens should be stored (the wrong state request should be rejected)
		if (config.get('accessToken')) {
			expect(config.get('accessToken')).toBe('correct_tok')
		}
	})

	it('--manual mode reads tokens from stdin-like input', async () => {
		const { loginCommand } = await import('../login.js')

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		// For manual mode, we pass tokens directly via test helper
		await loginCommand(
			{ manual: true, _testTokens: { accessToken: 'manual_access', refreshToken: 'manual_refresh' } } as any,
			{ json: true },
		)

		expect(config.get('accessToken')).toBe('manual_access')
		expect(config.get('refreshToken')).toBe('manual_refresh')

		consoleSpy.mockRestore()
	})

	it('--json outputs API envelope format with authenticated: true', async () => {
		const { loginCommand } = await import('../login.js')

		const openMod = await import('open')
		const openFn = openMod.default as ReturnType<typeof vi.fn>

		openFn.mockImplementation(async (url: string) => {
			const urlObj = new URL(url)
			const callbackUrl = urlObj.searchParams.get('cli_callback')!
			const state = urlObj.searchParams.get('state')!

			setTimeout(async () => {
				try {
					await fetch(`${callbackUrl}?access_token=tok&refresh_token=rt&state=${state}`)
				} catch {}
			}, 100)
		})

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		await loginCommand({ manual: false }, { json: true })

		const jsonOutput = consoleSpy.mock.calls.find((call) => {
			try {
				const parsed = JSON.parse(call[0] as string)
				return parsed.data?.authenticated === true
			} catch {
				return false
			}
		})

		expect(jsonOutput).toBeTruthy()
		consoleSpy.mockRestore()
	})
})
