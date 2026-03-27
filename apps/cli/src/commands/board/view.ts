import React from 'react'
import chalk from 'chalk'
import type { GlobalOptions, ApiEnvelope, ColumnResponse, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { resolveBoardId } from '../../lib/context.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'
import { BoardView } from '../../components/BoardView.js'

function dueDateColor(dueDate: string): typeof chalk {
	const due = new Date(dueDate)
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
	if (dueDay < today) return chalk.red
	if (dueDay.getTime() === today.getTime()) return chalk.yellow
	return chalk
}

export async function boardViewCommand(
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
			outputJson({ error: { code: 'NO_BOARD', message } }, {})
		} else if (mode === 'ink') {
			outputInk(React.createElement(ErrorDisplay, { message }))
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	// Step 1: Fetch all columns for the board
	const columnsResponse = await apiRequest(`/api/v1/boards/${boardId}/columns?limit=100`)
	if (!columnsResponse.ok) {
		const errorBody = (await columnsResponse.json()) as ApiError
		const message = columnsResponse.status === 404
			? 'Board not found.'
			: (errorBody.error?.message ?? 'Failed to fetch columns')
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

	const { data: columns } = (await columnsResponse.json()) as ApiEnvelope<ColumnResponse[]>

	// Step 2: Fetch items for each column in parallel
	const columnsWithItems = await Promise.all(
		columns.map(async (col) => {
			const itemsResp = await apiRequest(`/api/v1/columns/${col.id}/items?limit=50`)
			if (!itemsResp.ok) {
				return { ...col, items: [] as ItemResponse[] }
			}
			const { data: items } = (await itemsResp.json()) as ApiEnvelope<ItemResponse[]>
			return { ...col, items }
		}),
	)

	// Step 3: Output
	if (mode === 'json') {
		outputJson(columnsWithItems, { boardId })
	} else if (mode === 'ink') {
		outputInk(React.createElement(BoardView, { columns: columnsWithItems, width: process.stdout.columns ?? 80 }))
	} else {
		// Plain text fallback
		for (const col of columnsWithItems) {
			outputPlain(`=== ${col.name} (${col.items.length}) ===`)
			if (col.items.length === 0) {
				outputPlain('  (empty)')
			} else {
				for (const item of col.items) {
					let line = `  ${item.title}`
					if (item.labels && item.labels.length > 0) {
						line += ` ${chalk.dim(`[${item.labels.join(', ')}]`)}`
					}
					if (item.dueDate) {
						const colorFn = dueDateColor(item.dueDate)
						line += ` ${colorFn(item.dueDate.slice(0, 10))}`
					}
					outputPlain(line)
				}
			}
		}
	}
}
