import React from 'react'
import type { GlobalOptions, ApiEnvelope, ColumnResponse, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { confirm } from '../../lib/confirm.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

async function moveItemsInBatches(
	items: ItemResponse[],
	targetColumnId: string,
	batchSize = 5,
): Promise<void> {
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize)
		await Promise.all(
			batch.map((item) =>
				apiRequest(`/api/v1/items/${item.id}/move`, {
					method: 'POST',
					body: JSON.stringify({ columnId: targetColumnId }),
				}),
			),
		)
	}
}

export async function columnDeleteCommand(
	id: string,
	options: { force?: boolean; moveTo?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	// Step 1: GET the column to validate existence and get name
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

	// Step 2: GET items in column to check if non-empty
	const itemsResponse = await apiRequest(`/api/v1/columns/${id}/items?limit=1`)
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

	const itemsCheck = (await itemsResponse.json()) as ApiEnvelope<ItemResponse[]> & { meta: { total: number } }
	const itemCount = itemsCheck.meta?.total ?? itemsCheck.data.length

	// Step 3: Handle items logic
	let itemsMoved = 0

	if (itemCount > 0) {
		if (options.moveTo) {
			// Move all items to target column
			const allItemsResponse = await apiRequest(`/api/v1/columns/${id}/items?limit=200`)
			if (!allItemsResponse.ok) {
				const errorBody = (await allItemsResponse.json()) as ApiError
				const message = errorBody.error?.message ?? 'Failed to fetch items for move'
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

			const { data: allItems } = (await allItemsResponse.json()) as ApiEnvelope<ItemResponse[]>
			await moveItemsInBatches(allItems, options.moveTo)
			itemsMoved = allItems.length
		} else if (options.force) {
			// Confirm with user before force-deleting
			const confirmed = await confirm(
				`Delete column "${column.name}" and its ${itemCount} items? [y/N]`,
			)
			if (!confirmed) {
				return
			}
		} else {
			// No --move-to, no --force: error
			const message = `Column "${column.name}" has ${itemCount} items. Use --move-to <column-id> to relocate them, or --force to delete them.`
			if (mode === 'json') {
				outputJson({ error: { code: 'COLUMN_HAS_ITEMS', message } }, {})
			} else if (mode === 'ink') {
				outputInk(React.createElement(ErrorDisplay, { message }))
			} else {
				outputPlain(`Error: ${message}`)
			}
			process.exitCode = 1
			return
		}
	}

	// Step 4: Delete the column
	const deleteResponse = await apiRequest(`/api/v1/columns/${id}`, { method: 'DELETE' })

	if (!deleteResponse.ok) {
		const errorBody = (await deleteResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to delete column'
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

	// Step 5: Output
	const successMessage = itemsMoved > 0
		? `Moved ${itemsMoved} items to column ${options.moveTo} and deleted column ${column.name} (${id})`
		: `Deleted column ${column.name} (${id})`

	if (mode === 'json') {
		outputJson({ deleted: true, id, itemsMoved }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: successMessage }))
	} else {
		outputPlain(successMessage)
	}
}
