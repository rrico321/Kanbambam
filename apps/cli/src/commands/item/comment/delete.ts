import React from 'react'
import { SuccessMessage } from '../../../components/SuccessMessage.js'
import { apiRequest } from '../../../lib/api-client.js'
import { confirm } from '../../../lib/confirm.js'
import { detectOutputMode, outputInk, outputJson, outputPlain } from '../../../lib/output.js'
import type { ApiError, GlobalOptions } from '../../../types.js'
import { reportError } from './report.js'

export async function itemCommentDeleteCommand(
	commentId: string,
	options: { force?: boolean },
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	if (!options.force) {
		const confirmed = await confirm(`Delete comment ${commentId}?`)
		if (!confirmed) {
			return
		}
	}

	const response = await apiRequest(`/api/v1/comments/${commentId}`, { method: 'DELETE' })

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message =
			response.status === 404
				? 'Comment not found.'
				: (errorBody.error?.message ?? 'Failed to delete comment')
		reportError(globalOptions, message, errorBody)
		return
	}

	if (mode === 'json') {
		outputJson({ deleted: true, id: commentId }, {})
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Deleted comment ${commentId}` }))
	} else {
		outputPlain(`Deleted comment ${commentId}`)
	}
}
