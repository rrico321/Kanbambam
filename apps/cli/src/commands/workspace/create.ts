import React from 'react'
import type { GlobalOptions, ApiEnvelope, WorkspaceResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function workspaceCreateCommand(name: string, globalOptions: GlobalOptions): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	const response = await apiRequest('/api/v1/workspaces', {
		method: 'POST',
		body: JSON.stringify({ name }),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to create workspace'
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
		outputInk(React.createElement(SuccessMessage, { message: `Created workspace ${data.name} (${data.id})` }))
	} else {
		outputPlain(`Created workspace ${data.name} (${data.id})`)
	}
}
