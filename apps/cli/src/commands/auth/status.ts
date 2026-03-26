import React from 'react'
import type { GlobalOptions } from '../../types.js'
import { config, hasTokens } from '../../lib/config.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { AuthStatus } from '../../components/AuthStatus.js'

export async function statusCommand(globalOptions: GlobalOptions): Promise<void> {
	const mode = detectOutputMode(globalOptions)
	const authenticated = hasTokens()

	if (!authenticated) {
		if (mode === 'json') {
			outputJson({ authenticated: false }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(AuthStatus, { authenticated: false }))
		} else {
			outputPlain('Not logged in. Run kanbambam auth login to authenticate.')
		}
		return
	}

	// Decode JWT to extract info if possible
	let userId: string | undefined
	try {
		const { decodeJwt } = await import('jose')
		const accessToken = config.get('accessToken')
		if (accessToken) {
			const claims = decodeJwt(accessToken)
			userId = claims.sub as string | undefined
		}
	} catch {
		// Token might be malformed, that's ok
	}

	if (mode === 'json') {
		outputJson({ authenticated: true, ...(userId ? { userId } : {}) }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(AuthStatus, { authenticated: true }))
	} else {
		outputPlain(userId ? `Logged in (user: ${userId}).` : 'Logged in.')
	}
}
