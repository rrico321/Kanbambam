import React from 'react'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function itemMoveCommand(
	id: string,
	options: { to?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	if (!options.to) {
		const message = 'No target column. Use --to <column-id>.'
		if (mode === 'json') {
			outputJson({ error: { code: 'NO_TARGET_COLUMN', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	const response = await apiRequest(`/api/v1/items/${id}/move`, {
		method: 'POST',
		body: JSON.stringify({ columnId: options.to }),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = response.status === 404
			? 'Item not found.'
			: (errorBody.error?.message ?? 'Failed to move item')
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

	const { data, meta } = (await response.json()) as ApiEnvelope<ItemResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Moved item "${data.title}" to column ${options.to}` }))
	} else {
		outputPlain(`Moved item "${data.title}" to column ${options.to}`)
	}
}
