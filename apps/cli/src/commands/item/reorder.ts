import React from 'react'
import { generateKeyBetween } from 'fractional-indexing'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function itemReorderCommand(
	id: string,
	options: { position: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	const targetPos = parseInt(options.position, 10)
	if (Number.isNaN(targetPos) || targetPos < 1) {
		const message = 'Position must be a positive integer'
		if (mode === 'json') {
			outputJson({ error: { code: 'INVALID_POSITION', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	// Step 1: Get the item to find its columnId
	const itemResponse = await apiRequest(`/api/v1/items/${id}`)
	if (!itemResponse.ok) {
		const errorBody = (await itemResponse.json()) as ApiError
		const message = itemResponse.status === 404
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

	const { data: item } = (await itemResponse.json()) as ApiEnvelope<ItemResponse>

	// Step 2: Get all items in the column (sorted by position from API)
	const itemsResponse = await apiRequest(`/api/v1/columns/${item.columnId}/items?limit=100`)
	if (!itemsResponse.ok) {
		const errorBody = (await itemsResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to fetch items'
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

	const { data: allItems } = (await itemsResponse.json()) as ApiEnvelope<ItemResponse[]>

	// Remove the target item from the list to get remaining items
	const remainingItems = allItems.filter((i) => i.id !== id)
	const maxPos = remainingItems.length + 1

	if (targetPos > maxPos) {
		const message = `Position must be between 1 and ${maxPos}`
		if (mode === 'json') {
			outputJson({ error: { code: 'POSITION_OUT_OF_RANGE', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	// Calculate fractional index using generateKeyBetween
	let newPosition: string
	if (targetPos === 1) {
		// Before first remaining item
		newPosition = generateKeyBetween(null, remainingItems[0]?.position ?? null)
	} else if (targetPos > remainingItems.length) {
		// After last remaining item
		newPosition = generateKeyBetween(remainingItems[remainingItems.length - 1].position, null)
	} else {
		// Between two items
		newPosition = generateKeyBetween(
			remainingItems[targetPos - 2].position,
			remainingItems[targetPos - 1].position,
		)
	}

	// Step 3: POST move with same columnId (reorder within column)
	const moveResponse = await apiRequest(`/api/v1/items/${id}/move`, {
		method: 'POST',
		body: JSON.stringify({ columnId: item.columnId, position: newPosition }),
	})

	if (!moveResponse.ok) {
		const errorBody = (await moveResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to reorder item'
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

	const { data, meta } = (await moveResponse.json()) as ApiEnvelope<ItemResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Moved item "${data.title}" to position ${targetPos}` }))
	} else {
		outputPlain(`Moved item "${data.title}" to position ${targetPos}`)
	}
}
