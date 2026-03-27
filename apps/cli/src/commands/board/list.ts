import React from 'react'
import { apiRequest } from '../../lib/api-client.js'
import { resolveWorkspaceId } from '../../lib/context.js'
import { detectOutputMode, output, outputJson, outputPlain } from '../../lib/output.js'
import { Table } from '../../components/Table.js'
import { EmptyState } from '../../components/EmptyState.js'
import type { BoardResponse, GlobalOptions, PaginatedMeta } from '../../types.js'

export async function boardListCommand(
	options: { workspace?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	let workspaceId: string
	try {
		workspaceId = resolveWorkspaceId(options)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to resolve workspace'
		if (mode === 'json') {
			outputJson({ error: { code: 'NO_WORKSPACE', message } }, {})
		} else {
			outputPlain(`Error: ${message}`)
		}
		process.exitCode = 1
		return
	}

	const response = await apiRequest(`/api/v1/workspaces/${workspaceId}/boards?limit=50`)

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(
			(errorData as { error?: { message?: string } }).error?.message ??
				`Failed to list boards (${response.status})`,
		)
	}

	const { data, meta } = (await response.json()) as { data: BoardResponse[]; meta: PaginatedMeta }

	if (data.length === 0) {
		if (mode === 'json') {
			outputJson([], meta as unknown as Record<string, unknown>)
			return
		}
		output([], meta as unknown as Record<string, unknown>, {
			mode,
			inkComponent: React.createElement(EmptyState, {
				message: 'No boards in this workspace.',
				command: 'kanbambam board create <name>',
			}),
			plainText: 'No boards in this workspace. Run kanbambam board create <name> to create one.',
		})
		return
	}

	if (mode === 'json') {
		outputJson(data, meta as unknown as Record<string, unknown>)
		return
	}

	const columns = [
		{ key: 'id', label: 'ID', width: 20 },
		{ key: 'name', label: 'Name', width: 30 },
	]
	const rows = data.map((b) => ({ id: b.id, name: b.name }))

	output(data, meta as unknown as Record<string, unknown>, {
		mode,
		inkComponent: React.createElement(Table, { columns, rows }),
		plainText: rows.map((r) => `${r.id.padEnd(20)} ${r.name}`).join('\n'),
	})
}
