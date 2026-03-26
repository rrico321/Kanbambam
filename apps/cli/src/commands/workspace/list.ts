import React from 'react'
import type { GlobalOptions, WorkspaceResponse, PaginatedMeta } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { Table } from '../../components/Table.js'
import { EmptyState } from '../../components/EmptyState.js'

export async function workspaceListCommand(globalOptions: GlobalOptions): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	const response = await apiRequest('/api/v1/workspaces?limit=50')
	const { data, meta } = (await response.json()) as { data: WorkspaceResponse[]; meta: PaginatedMeta }

	if (data.length === 0) {
		if (mode === 'json') {
			outputJson([], meta)
		} else if (mode === 'ink') {
			outputInk(React.createElement(EmptyState, { message: 'No workspaces yet.', command: 'kanbambam workspace create <name>' }))
		} else {
			outputPlain('No workspaces yet. Run kanbambam workspace create <name> to create one.')
		}
		return
	}

	const columns = [
		{ key: 'id', label: 'ID', width: 20 },
		{ key: 'name', label: 'Name', width: 30 },
	]
	const rows = data.map((ws) => ({ id: ws.id, name: ws.name }))

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(Table, { columns, rows }))
	} else {
		outputPlain('ID                   Name')
		for (const row of rows) {
			outputPlain(`${row.id.padEnd(21)}${row.name}`)
		}
	}
}
