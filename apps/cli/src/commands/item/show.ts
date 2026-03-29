import React from 'react'
import chalk from 'chalk'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { ItemDetail } from '../../components/ItemDetail.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

function formatDueDatePlain(dueDate: string | null): string {
	if (!dueDate) return '(none)'
	const today = new Date()
	const todayStr = today.toISOString().slice(0, 10)
	const dueStr = dueDate.slice(0, 10)
	if (dueStr < todayStr) return chalk.red(dueStr)
	if (dueStr === todayStr) return chalk.yellow(dueStr)
	return dueStr
}

export async function itemShowCommand(
	id: string,
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	const response = await apiRequest(`/api/v1/items/${id}`)

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = response.status === 404
			? 'Item not found. It may have been deleted.'
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

	const { data, meta } = (await response.json()) as ApiEnvelope<ItemResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(ItemDetail, { item: data }))
	} else {
		const lines = [
			`Title: ${data.title}`,
			`ID: ${data.id}`,
			`Column: ${data.columnId}`,
			`Description: ${data.description ?? '(none)'}`,
			`Labels: ${data.labels?.join(', ') ?? '(none)'}`,
			`Due Date: ${formatDueDatePlain(data.dueDate)}`,
			`Assigned To: ${data.assignedTo ?? '(none)'}`,
			`Created: ${data.createdAt}`,
			`Updated: ${data.updatedAt}`,
		]
		outputPlain(lines.join('\n'))
	}
}
