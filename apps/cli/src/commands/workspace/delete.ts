import React from 'react'
import type { GlobalOptions, ApiEnvelope, WorkspaceResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'
import { confirm } from '../../lib/confirm.js'

export async function workspaceDeleteCommand(
	id: string,
	options: { force?: boolean },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	// Always fetch workspace first to validate existence and get name
	const getResponse = await apiRequest(`/api/v1/workspaces/${id}`)

	if (!getResponse.ok) {
		const errorBody = (await getResponse.json()) as ApiError
		const message = getResponse.status === 404
			? 'Workspace not found. It may have been deleted. Run kanbambam context clear if your context is stale.'
			: (errorBody.error?.message ?? 'Failed to fetch workspace')
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

	const { data: workspace } = (await getResponse.json()) as ApiEnvelope<WorkspaceResponse>

	// Confirm deletion unless --force
	if (!options.force) {
		const confirmed = await confirm(
			`Delete workspace "${workspace.name}" (${id})? This will delete all boards, columns, and items.`,
		)
		if (!confirmed) {
			return
		}
	}

	const deleteResponse = await apiRequest(`/api/v1/workspaces/${id}`, { method: 'DELETE' })

	if (!deleteResponse.ok) {
		const errorBody = (await deleteResponse.json()) as ApiError
		const message = errorBody.error?.message ?? 'Failed to delete workspace'
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

	if (mode === 'json') {
		outputJson({ deleted: true, id }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Deleted workspace ${workspace.name} (${id})` }))
	} else {
		outputPlain(`Deleted workspace ${workspace.name} (${id})`)
	}
}
