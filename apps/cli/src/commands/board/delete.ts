import React from 'react'
import { apiRequest } from '../../lib/api-client.js'
import { confirm } from '../../lib/confirm.js'
import { detectOutputMode, output, outputJson } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'
import type { ApiEnvelope, BoardResponse, GlobalOptions } from '../../types.js'

export async function boardDeleteCommand(
	id: string,
	options: { force?: boolean },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	// Fetch board first to validate existence and get name
	const getResponse = await apiRequest(`/api/v1/boards/${id}`)

	if (getResponse.status === 404) {
		const msg = 'Board not found. It may have been deleted. Run kanbambam context clear if your context is stale.'
		if (mode === 'json') {
			outputJson({ error: msg }, {})
			return
		}
		output(null, {}, {
			mode,
			inkComponent: React.createElement(ErrorDisplay, { message: msg }),
			plainText: msg,
		})
		return
	}

	if (!getResponse.ok) {
		const errorData = await getResponse.json()
		throw new Error(
			(errorData as { error?: { message?: string } }).error?.message ??
				`Failed to fetch board (${getResponse.status})`,
		)
	}

	const { data: board } = (await getResponse.json()) as ApiEnvelope<BoardResponse>

	if (!options.force) {
		const confirmed = await confirm(
			`Delete board "${board.name}" (${board.id})? This will delete all columns and items.`,
		)
		if (!confirmed) {
			const msg = 'Cancelled.'
			if (mode === 'json') {
				outputJson({ deleted: false, id }, {})
				return
			}
			output(null, {}, {
				mode,
				inkComponent: React.createElement(SuccessMessage, { message: msg }),
				plainText: msg,
			})
			return
		}
	}

	const deleteResponse = await apiRequest(`/api/v1/boards/${id}`, { method: 'DELETE' })

	if (!deleteResponse.ok && deleteResponse.status !== 204) {
		throw new Error(`Failed to delete board (${deleteResponse.status})`)
	}

	const msg = `Deleted board ${board.name} (${board.id})`

	if (mode === 'json') {
		outputJson({ deleted: true, id }, {})
		return
	}

	output(null, {}, {
		mode,
		inkComponent: React.createElement(SuccessMessage, { message: msg }),
		plainText: msg,
	})
}
