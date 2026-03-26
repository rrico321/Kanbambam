import React from 'react'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { resolveColumnId } from '../../lib/context.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function itemCreateCommand(
	title: string,
	options: { column?: string; description?: string; board?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	let columnId: string
	try {
		columnId = resolveColumnId(options)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to resolve column'
		if (mode === 'json') {
			outputJson({ error: { code: 'NO_COLUMN', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	const body: Record<string, string> = { title }
	if (options.description) {
		body.description = options.description
	}

	const response = await apiRequest(`/api/v1/columns/${columnId}/items`, {
		method: 'POST',
		body: JSON.stringify(body),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to create item'
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
		outputInk(React.createElement(SuccessMessage, { message: `Created item "${data.title}" (${data.id})` }))
	} else {
		outputPlain(`Created item "${data.title}" (${data.id})`)
	}
}
