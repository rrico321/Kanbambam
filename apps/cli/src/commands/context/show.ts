import React from 'react'
import type { GlobalOptions } from '../../types.js'
import { config } from '../../lib/config.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { ContextDisplay } from '../../components/ContextDisplay.js'

export async function contextShowCommand(globalOptions: GlobalOptions): Promise<void> {
	const mode = detectOutputMode(globalOptions)
	const activeWorkspace = config.get('activeWorkspace') ?? null
	const activeBoard = config.get('activeBoard') ?? null

	if (mode === 'json') {
		outputJson({ workspace: activeWorkspace, board: activeBoard }, {})
	} else if (mode === 'ink') {
		outputInk(
			React.createElement(ContextDisplay, {
				workspace: activeWorkspace,
				board: activeBoard,
			}),
		)
	} else {
		const wsLine = activeWorkspace
			? `Workspace: ${activeWorkspace.name} (${activeWorkspace.id})`
			: 'Workspace: (not set)'
		const boardLine = activeBoard
			? `Board:     ${activeBoard.name} (${activeBoard.id})`
			: 'Board:     (not set)'
		outputPlain(`${wsLine}\n${boardLine}`)
	}
}
