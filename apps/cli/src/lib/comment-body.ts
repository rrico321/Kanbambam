import { readFileSync } from 'node:fs'

export interface BodyOptions {
	body?: string
	bodyFile?: string
}

export type BodyResult = { ok: true; body: string } | { ok: false; code: string; message: string }

/**
 * Resolve the comment body from --body or --body-file (use "-" to read stdin).
 * Exactly one source is required; the result must be non-empty.
 */
export function resolveCommentBody(options: BodyOptions): BodyResult {
	if (options.body !== undefined && options.bodyFile !== undefined) {
		return {
			ok: false,
			code: 'INVALID_ARGS',
			message: 'Use either --body or --body-file, not both.',
		}
	}
	if (options.body === undefined && options.bodyFile === undefined) {
		return {
			ok: false,
			code: 'NO_BODY',
			message: 'Comment body required. Use --body <text> or --body-file <path>.',
		}
	}

	let body: string
	if (options.bodyFile !== undefined) {
		try {
			body = readFileSync(options.bodyFile === '-' ? 0 : options.bodyFile, 'utf-8')
		} catch (err) {
			const reason = err instanceof Error ? err.message : String(err)
			return { ok: false, code: 'BODY_FILE_ERROR', message: `Could not read body file: ${reason}` }
		}
	} else {
		body = options.body as string
	}

	if (body.trim() === '') {
		return { ok: false, code: 'EMPTY_BODY', message: 'Comment body cannot be empty.' }
	}
	return { ok: true, body }
}
