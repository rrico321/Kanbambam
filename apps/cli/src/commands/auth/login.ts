import http from 'node:http'
import crypto from 'node:crypto'
import readline from 'node:readline'
import React from 'react'
import type { GlobalOptions } from '../../types.js'
import { config } from '../../lib/config.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { AuthSuccess } from '../../components/AuthSuccess.js'

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000
const WEB_BASE_URL = process.env.WEB_URL || 'https://kanbambam.vercel.app'

interface LoginOptions {
	manual?: boolean
	/** Test-only: override timeout for faster tests */
	_testTimeout?: number
	/** Test-only: provide tokens directly for manual mode tests */
	_testTokens?: { accessToken: string; refreshToken: string }
}

export async function loginCommand(
	options: LoginOptions,
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	if (options.manual) {
		await handleManualLogin(options, mode)
		return
	}

	await handleBrowserLogin(options, mode)
}

async function handleManualLogin(
	options: LoginOptions,
	mode: ReturnType<typeof detectOutputMode>,
): Promise<void> {
	let accessToken: string
	let refreshToken: string

	if (options._testTokens) {
		// Test path: use provided tokens directly
		accessToken = options._testTokens.accessToken
		refreshToken = options._testTokens.refreshToken
	} else {
		// Build a login URL for the user to open manually
		const state = crypto.randomBytes(16).toString('hex')
		const loginUrl = `${WEB_BASE_URL}/auth/login?state=${state}`

		console.log(`Open this URL in your browser to log in:\n`)
		console.log(`  ${loginUrl}\n`)

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stderr,
		})

		accessToken = await new Promise<string>((resolve) => {
			rl.question('After logging in, paste your access token: ', (answer) => {
				resolve(answer.trim())
			})
		})

		refreshToken = await new Promise<string>((resolve) => {
			rl.question('Paste your refresh token: ', (answer) => {
				resolve(answer.trim())
				rl.close()
			})
		})
	}

	config.set('accessToken', accessToken)
	config.set('refreshToken', refreshToken)

	outputSuccess(mode)
}

async function handleBrowserLogin(
	options: LoginOptions,
	mode: ReturnType<typeof detectOutputMode>,
): Promise<void> {
	const state = crypto.randomBytes(16).toString('hex')
	const timeoutMs = options._testTimeout ?? DEFAULT_TIMEOUT_MS

	return new Promise<void>((resolve, reject) => {
		const server = http.createServer((req, res) => {
			if (!req.url?.startsWith('/callback')) {
				res.writeHead(404)
				res.end('Not found')
				return
			}

			const url = new URL(req.url, `http://localhost`)
			const callbackState = url.searchParams.get('state')
			const accessToken = url.searchParams.get('access_token')
			const refreshToken = url.searchParams.get('refresh_token')

			// Verify CSRF state parameter
			if (callbackState !== state) {
				res.writeHead(400, { 'Content-Type': 'text/plain' })
				res.end('State mismatch - possible CSRF attack. Please try again.')
				return
			}

			if (!accessToken || !refreshToken) {
				res.writeHead(400, { 'Content-Type': 'text/plain' })
				res.end('Missing tokens in callback')
				return
			}

			// Store tokens
			config.set('accessToken', accessToken)
			config.set('refreshToken', refreshToken)

			// Respond with success HTML
			res.writeHead(200, { 'Content-Type': 'text/html' })
			res.end('<h2>Authentication successful!</h2><p>You can close this tab.</p>')

			// Clean up and resolve
			clearTimeout(timer)
			server.close(() => {
				outputSuccess(mode)
				resolve()
			})
		})

		// Listen on random port
		server.listen(0, async () => {
			const address = server.address()
			if (!address || typeof address === 'string') {
				reject(new Error('Failed to start callback server'))
				return
			}

			const port = address.port
			const callbackUrl = `http://localhost:${port}/callback`
			const loginUrl = `${WEB_BASE_URL}/auth/login?cli_callback=${encodeURIComponent(callbackUrl)}&state=${state}`

			if (mode === 'plain' || mode === 'json') {
				console.log('Opening browser to log in...')
			}

			try {
				const open = (await import('open')).default
				await open(loginUrl)
			} catch {
				// If open fails, display URL for manual opening
				console.log(`Could not open browser. Visit this URL to log in:\n  ${loginUrl}`)
			}
		})

		// Timeout
		const timer = setTimeout(() => {
			server.close()
			if (mode === 'json') {
				outputJson({ authenticated: false, error: 'Authentication timed out' }, {})
			} else {
				outputPlain('Authentication timed out. Run kanbambam auth login to try again.')
			}
			reject(new Error('Authentication timed out'))
		}, timeoutMs)
	})
}

function outputSuccess(mode: ReturnType<typeof detectOutputMode>): void {
	if (mode === 'json') {
		outputJson({ authenticated: true }, {})
	} else if (mode === 'plain') {
		outputPlain('Logged in successfully.')
	} else {
		outputInk(React.createElement(AuthSuccess, {}))
	}
}
