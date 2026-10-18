import React from 'react'
import { ErrorDisplay } from '../../../components/ErrorDisplay.js'
import { detectOutputMode, outputInk, outputJson, outputPlain } from '../../../lib/output.js'
import type { GlobalOptions } from '../../../types.js'

/** Print an error in the active output mode and set a failing exit code. */
export function reportError(
	globalOptions: GlobalOptions,
	message: string,
	errorBody?: unknown,
	code = 'ERROR',
): void {
	const mode = detectOutputMode(globalOptions)
	if (mode === 'json') {
		outputJson(errorBody ?? { error: { code, message } }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(ErrorDisplay, { message }))
	} else {
		outputPlain(`Error: ${message}`)
	}
	process.exitCode = 1
}
