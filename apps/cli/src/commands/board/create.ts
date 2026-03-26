import React from 'react'
import { apiRequest } from '../../lib/api-client.js'
import { resolveWorkspaceId } from '../../lib/context.js'
import { detectOutputMode, output, outputJson } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import type { ApiEnvelope, BoardResponse, GlobalOptions } from '../../types.js'

export async function boardCreateCommand(
	name: string,
	options: { workspace?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const workspaceId = resolveWorkspaceId(options)
	const mode = detectOutputMode(globalOptions)

	const response = await apiRequest(`/api/v1/workspaces/${workspaceId}/boards`, {
		method: 'POST',
		body: JSON.stringify({ name }),
	})

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(
			(errorData as { error?: { message?: string } }).error?.message ??
				`Failed to create board (${response.status})`,
		)
	}

	const { data: board, meta } = (await response.json()) as ApiEnvelope<BoardResponse>

	const defaultColumns = ['To Do', 'In Progress', 'Done']
	const failedColumns: string[] = []

	for (const colName of defaultColumns) {
		try {
			const colResponse = await apiRequest(`/api/v1/boards/${board.id}/columns`, {
				method: 'POST',
				body: JSON.stringify({ name: colName }),
			})
			if (!colResponse.ok) {
				failedColumns.push(colName)
			}
		} catch {
			failedColumns.push(colName)
		}
	}

	if (mode === 'json') {
		const columnsMeta =
			failedColumns.length === 0
				? { defaultColumns: ['To Do', 'In Progress', 'Done'] }
				: {
						defaultColumns: {
							created: defaultColumns.filter((c) => !failedColumns.includes(c)),
							failed: failedColumns,
						},
					}
		outputJson(board, { ...meta, ...columnsMeta })
		return
	}

	const successMsg =
		failedColumns.length === 0
			? `Created board ${board.name} (${board.id}) with columns: To Do, In Progress, Done`
			: `Created board ${board.name} (${board.id}). Warning: failed to create default column(s): ${failedColumns.join(', ')}`

	output(board, meta, {
		mode,
		inkComponent: React.createElement(SuccessMessage, { message: successMsg }),
		plainText: successMsg,
	})
}
