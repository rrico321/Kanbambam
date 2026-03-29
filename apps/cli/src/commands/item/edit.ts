import React from 'react'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export function collect(value: string, previous: string[]) {
	return previous.concat([value])
}

export async function itemEditCommand(
	id: string,
	options: { title?: string; description?: string; label?: string[]; dueDate?: string; assignedTo?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	// Build PATCH body from provided flags only
	const body: Record<string, unknown> = {}
	if (options.title !== undefined) body.title = options.title
	if (options.description !== undefined) {
		body.description = options.description === '' ? null : options.description
	}
	if (options.label !== undefined && options.label.length > 0) {
		if (options.label.length === 1 && options.label[0] === '') {
			body.labels = null
		} else {
			body.labels = options.label
		}
	}
	if (options.dueDate !== undefined) {
		body.dueDate = options.dueDate === '' ? null : options.dueDate
	}
	if (options.assignedTo !== undefined) {
		body.assignedTo = options.assignedTo === '' ? null : options.assignedTo
	}

	// Validate at least one flag provided
	if (Object.keys(body).length === 0) {
		const message = 'No changes specified. Use --title, --description, --label, --due-date, or --assigned-to.'
		if (mode === 'json') {
			outputJson({ error: { code: 'NO_CHANGES', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	// Validate due date format if provided and non-empty
	if (body.dueDate !== undefined && body.dueDate !== null) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate as string)) {
			const message = 'Invalid date format. Use YYYY-MM-DD (e.g., 2026-04-01).'
			if (mode === 'json') {
				outputJson({ error: { code: 'INVALID_DATE', message } }, {})
			} else if (mode === 'ink') {
				outputInk(React.createElement(ErrorDisplay, { message }))
			} else {
				outputPlain(`Error: ${message}`)
			}
			process.exitCode = 1
			return
		}
	}

	// PATCH the item
	const response = await apiRequest(`/api/v1/items/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(body),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = response.status === 404
			? 'Item not found.'
			: (errorBody.error?.message ?? 'Failed to update item')
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
		outputInk(React.createElement(SuccessMessage, { message: `Updated item "${data.title}" (${data.id})` }))
	} else {
		outputPlain(`Updated item "${data.title}" (${data.id})`)
	}
}
