import React from 'react'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { confirm } from '../../lib/confirm.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function itemDeleteCommand(
	id: string,
	options: { force?: boolean },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	// Step 1: GET the item to validate existence and get title for confirmation
	const getResponse = await apiRequest(`/api/v1/items/${id}`)
	if (!getResponse.ok) {
		const errorBody = (await getResponse.json()) as ApiError
		const message = getResponse.status === 404
			? 'Item not found.'
			: (errorBody.error?.message ?? 'Failed to fetch item')
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

	const { data } = (await getResponse.json()) as ApiEnvelope<ItemResponse>

	// Step 2: Confirm deletion unless --force
	if (!options.force) {
		const confirmed = await confirm(`Delete item "${data.title}"? [y/N]`)
		if (!confirmed) {
			return
		}
	}

	// Step 3: DELETE the item
	const deleteResponse = await apiRequest(`/api/v1/items/${id}`, { method: 'DELETE' })

	if (!deleteResponse.ok) {
		const errorBody = (await deleteResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to delete item'
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

	// Step 4: Output success
	if (mode === 'json') {
		outputJson({ deleted: true, id }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Deleted item "${data.title}" (${id})` }))
	} else {
		outputPlain(`Deleted item "${data.title}" (${id})`)
	}
}
