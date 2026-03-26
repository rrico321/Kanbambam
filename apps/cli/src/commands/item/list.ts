import React from 'react'
import chalk from 'chalk'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { resolveColumnId } from '../../lib/context.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { Table } from '../../components/Table.js'
import { EmptyState } from '../../components/EmptyState.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

function dueDateStatus(dueDate: string | null): 'overdue' | 'today' | 'normal' {
	if (!dueDate) return 'normal'
	const today = new Date()
	const todayStr = today.toISOString().slice(0, 10)
	const dueStr = dueDate.slice(0, 10)
	if (dueStr < todayStr) return 'overdue'
	if (dueStr === todayStr) return 'today'
	return 'normal'
}

function formatDueDatePlain(dueDate: string | null): string {
	if (!dueDate) return ''
	const status = dueDateStatus(dueDate)
	const display = dueDate.slice(0, 10)
	if (status === 'overdue') return chalk.red(display)
	if (status === 'today') return chalk.yellow(display)
	return display
}

export async function itemListCommand(
	options: { column?: string; board?: string },
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

	const response = await apiRequest(`/api/v1/columns/${columnId}/items?limit=50`)

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to list items'
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

	const { data: items, meta } = (await response.json()) as ApiEnvelope<ItemResponse[]>

	if (items.length === 0) {
		if (mode === 'json') {
			outputJson([], meta)
		} else if (mode === 'ink') {
			outputInk(React.createElement(EmptyState, {
				message: 'No items found.',
				command: 'kanbambam item create <title> --column <id>',
			}))
		} else {
			outputPlain('No items found. Run kanbambam item create <title> --column <id> to create one.')
		}
		return
	}

	if (mode === 'json') {
		outputJson(items, meta)
		return
	}

	const columns = [
		{ key: 'id', label: 'ID', width: 20 },
		{ key: 'title', label: 'Title', width: 30 },
		{ key: 'labels', label: 'Labels', width: 20 },
		{ key: 'dueDate', label: 'Due Date', width: 15 },
	]

	const rows = items.map((item) => ({
		id: item.id,
		title: item.title,
		labels: (item.labels ?? []).join(', '),
		dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
	}))

	if (mode === 'ink') {
		outputInk(React.createElement(Table, { columns, rows }))
	} else {
		const header = columns.map((c) => c.label.padEnd(c.width ?? 20)).join(' ')
		const separator = columns.map((c) => '-'.repeat(c.width ?? 20)).join(' ')
		const body = items.map((item) => {
			const id = item.id.padEnd(20)
			const title = item.title.padEnd(30)
			const labels = (item.labels ?? []).join(', ').padEnd(20)
			const dueDate = formatDueDatePlain(item.dueDate).padEnd(15)
			return `${id} ${title} ${labels} ${dueDate}`
		}).join('\n')
		outputPlain(`${header}\n${separator}\n${body}`)
	}
}
