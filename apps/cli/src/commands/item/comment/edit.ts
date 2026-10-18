import React from 'react'
import { SuccessMessage } from '../../../components/SuccessMessage.js'
import { apiRequest } from '../../../lib/api-client.js'
import { type BodyOptions, resolveCommentBody } from '../../../lib/comment-body.js'
import { detectOutputMode, outputInk, outputJson, outputPlain } from '../../../lib/output.js'
import type { ApiEnvelope, ApiError, CommentResponse, GlobalOptions } from '../../../types.js'
import { reportError } from './report.js'

export async function itemCommentEditCommand(
	commentId: string,
	options: BodyOptions,
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	const resolved = resolveCommentBody(options)
	if (!resolved.ok) {
		reportError(globalOptions, resolved.message, undefined, resolved.code)
		return
	}

	const response = await apiRequest(`/api/v1/comments/${commentId}`, {
		method: 'PATCH',
		body: JSON.stringify({ body: resolved.body }),
	})

	if (!response.ok) {
		const errorBody = (await response.json()) as ApiError
		const message =
			response.status === 404
				? 'Comment not found.'
				: (errorBody.error?.message ?? 'Failed to edit comment')
		reportError(globalOptions, message, errorBody)
		return
	}

	const { data, meta } = (await response.json()) as ApiEnvelope<CommentResponse>

	if (mode === 'json') {
		outputJson(data, meta)
	} else if (mode === 'ink') {
		outputInk(React.createElement(SuccessMessage, { message: `Updated comment ${data.id}` }))
	} else {
		outputPlain(`Updated comment ${data.id}`)
	}
}
