import React from 'react'
import { SuccessMessage } from '../../../components/SuccessMessage.js'
import { apiRequest } from '../../../lib/api-client.js'
import { type BodyOptions, resolveCommentBody } from '../../../lib/comment-body.js'
import { detectOutputMode, outputInk, outputJson, outputPlain } from '../../../lib/output.js'
import type { ApiEnvelope, ApiError, CommentResponse, GlobalOptions } from '../../../types.js'
import { reportError } from './report.js'

export async function itemCommentAddCommand(
	itemId: string,
	options: BodyOptions,
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	const resolved = resolveCommentBody(options)
	if (!resolved.ok) {
		reportError(globalOptions, resolved.message, undefined, resolved.code)
		return
	}

	const response = await apiRequest(`/api/v1/items/${itemId}/comments`, {
		method: 'POST',
		body: JSON.stringify({ body: resolved.body }),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message =
			response.status === 404
				? 'Item not found.'
				: (errorBody.error?.message ?? 'Failed to add comment')
		reportError(globalOptions, message, errorBody)
		return
	}

	const { data, meta } = (await response.json()) as ApiEnvelope<CommentResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(
			React.createElement(SuccessMessage, {
				message: `Added comment ${data.id} to item ${data.itemId}`,
			}),
		)
	} else {
		outputPlain(`Added comment ${data.id} to item ${data.itemId}`)
	}
}
