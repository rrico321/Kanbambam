import React from 'react'
import type { GlobalOptions, WorkspaceResponse, BoardResponse, ApiEnvelope } from '../../types.js'
import { config } from '../../lib/config.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'

export async function contextSetCommand(
	options: { workspace?: string; board?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	if (!options.workspace && !options.board) {
		throw new Error('Provide at least one of --workspace or --board.')
	}

	let workspaceEntry: { id: string; name: string } | null = null
	let boardEntry: { id: string; name: string } | null = null

	// Set workspace if provided
	if (options.workspace) {
		const response = await apiRequest(`/api/v1/workspaces/${options.workspace}`)
		if (!response.ok) {
			throw new Error(`Workspace not found: ${options.workspace}`)
		}
		const body = (await response.json()) as ApiEnvelope<WorkspaceResponse>
		workspaceEntry = { id: body.data.id, name: body.data.name }
		config.set('activeWorkspace', workspaceEntry)
	}

	// Set board if provided
	if (options.board) {
		const boardResponse = await apiRequest(`/api/v1/boards/${options.board}`)
		if (!boardResponse.ok) {
			throw new Error(`Board not found: ${options.board}`)
		}
		const boardBody = (await boardResponse.json()) as ApiEnvelope<BoardResponse>
		boardEntry = { id: boardBody.data.id, name: boardBody.data.name }
		config.set('activeBoard', boardEntry)

		// Auto-set parent workspace if workspace was not explicitly provided (D-05)
		if (!options.workspace) {
			const wsResponse = await apiRequest(
				`/api/v1/workspaces/${boardBody.data.workspaceId}`,
			)
			if (wsResponse.ok) {
				const wsBody = (await wsResponse.json()) as ApiEnvelope<WorkspaceResponse>
				workspaceEntry = { id: wsBody.data.id, name: wsBody.data.name }
				config.set('activeWorkspace', workspaceEntry)
			}
		}
	}

	// Build success message
	let message: string
	if (boardEntry && workspaceEntry) {
		message = `Context set to board ${boardEntry.name} (${boardEntry.id}) in workspace ${workspaceEntry.name}`
	} else if (workspaceEntry) {
		message = `Context set to workspace ${workspaceEntry.name} (${workspaceEntry.id})`
	} else {
		message = 'Context updated'
	}

	const resultData = {
		workspace: config.get('activeWorkspace') ?? null,
		board: config.get('activeBoard') ?? null,
	}

	if (mode === 'json') {
		outputJson(resultData, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message }))
	} else {
		outputPlain(message)
	}
}
