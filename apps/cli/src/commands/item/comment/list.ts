import React from 'react'
import { CommentThread } from '../../../components/CommentThread.js'
import { EmptyState } from '../../../components/EmptyState.js'
import { apiRequest } from '../../../lib/api-client.js'
import { detectOutputMode, outputInk, outputJson, outputPlain } from '../../../lib/output.js'
import { stripControlSequences } from '../../../lib/sanitize.js'
import type { ApiEnvelope, ApiError, CommentResponse, GlobalOptions } from '../../../types.js'
import { reportError } from './report.js'

const PAGE_SIZE = 100

function formatWhen(comment: CommentResponse): string {
	const created = comment.createdAt.replace('T', ' ').slice(0, 16)
	return comment.updatedAt !== comment.createdAt ? `${created} (edited)` : created
}

export async function itemCommentListCommand(
	itemId: string,
	globalOptions: GlobalOptions,
): Promise<void> {
	const mode = detectOutputMode(globalOptions)

	// Oldest first; follow cursors so the whole thread is returned
	const comments: CommentResponse[] = []
	let total = 0
	let cursor: string | null = null
	do {
		const query: string = `limit=${PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
		const response = await apiRequest(`/api/v1/items/${itemId}/comments?${query}`)

		if (!response.ok) {
			const errorBody = (await response.json()) as ApiError
			const message =
				response.status === 404
					? 'Item not found.'
					: (errorBody.error?.message ?? 'Failed to list comments')
			reportError(globalOptions, message, errorBody)
			return
		}

		const page = (await response.json()) as ApiEnvelope<CommentResponse[]>
		comments.push(...page.data)
		total = (page.meta.total as number | undefined) ?? comments.length
		cursor = (page.meta.cursor as string | null | undefined) ?? null
	} while (cursor)

	if (mode === 'json') {
		outputJson(comments, { total, cursor: null })
		return
	}

	if (comments.length === 0) {
		if (mode === 'ink') {
			outputInk(
				React.createElement(EmptyState, {
					message: 'No comments yet.',
					command: 'kanbambam item comment add <item-id> --body <text>',
				}),
			)
		} else {
			outputPlain(
				'No comments yet. Run kanbambam item comment add <item-id> --body <text> to add one.',
			)
		}
		return
	}

	// --json stays raw (JSON escapes control characters); anything printed to the terminal is stripped
	const safe = comments.map((c) => ({
		...c,
		id: stripControlSequences(c.id),
		authorEmail: stripControlSequences(c.authorEmail),
		body: stripControlSequences(c.body),
	}))

	if (mode === 'ink') {
		outputInk(
			React.createElement(CommentThread, {
				comments: safe.map((c) => ({ ...c, when: formatWhen(c) })),
			}),
		)
	} else {
		outputPlain(
			safe.map((c) => `${c.authorEmail} · ${formatWhen(c)} · ${c.id}\n${c.body}`).join('\n\n'),
		)
	}
}
