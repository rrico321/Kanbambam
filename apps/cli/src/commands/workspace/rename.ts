import React from 'react'
import type { GlobalOptions, ApiEnvelope, WorkspaceResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function workspaceRenameCommand(
	id: string,
	options: { name?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	if (!options.name) {
		const message = 'Name is required. Use --name <new-name>'
		if (mode === 'json') {
			outputJson({ error: { code: 'MISSING_OPTION', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	const response = await apiRequest(`/api/v1/workspaces/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ name: options.name }),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = response.status === 404
			? 'Workspace not found. It may have been deleted. Run kanbambam context clear if your context is stale.'
			: (errorBody.error?.message ?? 'Failed to rename workspace')
		if (mode === 'json') {
			outputJson(errorBody, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	const { data, meta } = (await response.json()) as ApiEnvelope<WorkspaceResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Renamed workspace to ${data.name} (${data.id})` }))
	} else {
		outputPlain(`Renamed workspace to ${data.name} (${data.id})`)
	}
}
