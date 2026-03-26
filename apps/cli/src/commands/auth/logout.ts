import type { GlobalOptions } from '../../types.js'
import { clearTokens, config, hasTokens } from '../../lib/config.js'
import { detectOutputMode, outputJson, outputPlain } from '../../lib/output.js'

export async function logoutCommand(globalOptions: GlobalOptions): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	if (!hasTokens()) {
		if (mode === 'json') {
			outputJson({ message: 'Not currently logged in' }, {})
		} else {
			outputPlain('Not currently logged in.')
		}
		return
	}

	// Best effort server-side revoke (per D-12)
	const refreshToken = config.get('refreshToken')
	const apiBaseUrl = config.get('apiBaseUrl')

	try {
		await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		})
	} catch {
		// Ignore errors - best effort revoke
	}

	// Always clear local tokens regardless of API result
	clearTokens()

	if (mode === 'json') {
		outputJson({ message: 'Logged out successfully' }, {})
	} else {
		outputPlain('Logged out successfully.')
	}
}
