import React from 'react'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, output, outputJson } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'
import type { ApiEnvelope, BoardResponse, GlobalOptions } from '../../types.js'

export async function boardRenameCommand(
	id: string,
	options: { name?: string },
	globalOptions: GlobalOptions,
): Promise<void> {
	if (!options.name) {
		throw new Error('Name is required. Use --name <new-name>')
	}

	const mode = detectOutputMode(globalOptions)

	const response = await apiRequest(`/api/v1/boards/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ name: options.name }),
	})

	if (response.status === 404) {
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

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(
			(errorData as { error?: { message?: string } }).error?.message ??
				`Failed to rename board (${response.status})`,
		)
	}

	const { data, meta } = (await response.json()) as ApiEnvelope<BoardResponse>
	const msg = `Renamed board to ${data.name} (${data.id})`

	if (mode === 'json') {
		outputJson(data, meta)
		return
	}

	output(data, meta, {
		mode,
		inkComponent: React.createElement(SuccessMessage, { message: msg }),
		plainText: msg,
	})
}
