import React from 'react'
import type { GlobalOptions, ApiEnvelope, ColumnResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { resolveBoardId } from '../../lib/context.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function columnAddCommand(
	name: string,
	options: { board?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	let boardId: string
	try {
		boardId = resolveBoardId(options)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to resolve board'
		if (mode === 'json') {
			outputJson({ error: { code: 'NO_BOARD_CONTEXT', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	const response = await apiRequest(`/api/v1/boards/${boardId}/columns`, {
		method: 'POST',
		body: JSON.stringify({ name }),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to add column'
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

	const { data, meta } = (await response.json()) as ApiEnvelope<ColumnResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Added column ${data.name} (${data.id})` }))
	} else {
		outputPlain(`Added column ${data.name} (${data.id})`)
	}
}
