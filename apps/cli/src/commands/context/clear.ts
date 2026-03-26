import React from 'react'
import type { GlobalOptions } from '../../types.js'
import { clearContext } from '../../lib/config.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'

export async function contextClearCommand(globalOptions: GlobalOptions): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	clearContext()

	if (mode === 'json') {
		outputJson({ workspace: null, board: null }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: 'Context cleared' }))
	} else {
		outputPlain('Context cleared')
	}
}
