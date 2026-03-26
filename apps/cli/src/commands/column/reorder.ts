import React from 'react'
import { generateKeyBetween } from 'fractional-indexing'
import type { GlobalOptions, ApiEnvelope, ColumnResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function columnReorderCommand(
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

	// Step 1: Get the column to find its boardId
	const columnResponse = await apiRequest(`/api/v1/columns/${id}`)
	if (!columnResponse.ok) {
		const errorBody = (await columnResponse.json()) as ApiError
		const message = columnResponse.status === 404
			? 'Column not found. It may have been deleted. Run kanbambam context clear if your context is stale.'
			: (errorBody.error?.message ?? 'Failed to fetch column')
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

	const { data: column } = (await columnResponse.json()) as ApiEnvelope<ColumnResponse>

	// Step 2: Get all columns for the board (sorted by position from API)
	const columnsResponse = await apiRequest(`/api/v1/boards/${column.boardId}/columns?limit=100`)
	if (!columnsResponse.ok) {
		const errorBody = (await columnsResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to fetch columns'
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

	const { data: allColumns } = (await columnsResponse.json()) as ApiEnvelope<ColumnResponse[]>

	// Remove the target column from the list to get remaining columns
	const remainingColumns = allColumns.filter((c) => c.id !== id)
	const maxPos = remainingColumns.length + 1

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
		// Before first remaining column
		newPosition = generateKeyBetween(null, remainingColumns[0]?.position ?? null)
	} else if (targetPos > remainingColumns.length) {
		// After last remaining column
		newPosition = generateKeyBetween(remainingColumns[remainingColumns.length - 1].position, null)
	} else {
		// Between two columns
		newPosition = generateKeyBetween(
			remainingColumns[targetPos - 2].position,
			remainingColumns[targetPos - 1].position,
		)
	}

	// Step 3: PATCH the column with new position
	const patchResponse = await apiRequest(`/api/v1/columns/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ position: newPosition }),
	})

	if (!patchResponse.ok) {
		const errorBody = (await patchResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to reorder column'
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

	const { data, meta } = (await patchResponse.json()) as ApiEnvelope<ColumnResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Moved column ${data.name} to position ${targetPos}` }))
	} else {
		outputPlain(`Moved column ${data.name} to position ${targetPos}`)
	}
}
