import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock ink to avoid yoga-layout WASM loading in tests
vi.mock('ink', () => ({
	render: vi.fn(),
	Text: vi.fn(),
	Box: vi.fn(),
}))

vi.mock('../../../../lib/api-client.js', () => ({
	apiRequest: vi.fn(),
}))

vi.mock('../../../../lib/confirm.js', () => ({
	confirm: vi.fn(),
}))

const comment = {
	id: 'cmt_abc',
	itemId: 'itm_abc',
	authorId: 'usr_1',
	authorEmail: 'agent@example.com',
	body: 'Hello',
	createdAt: '2026-01-01T10:00:00.000Z',
	updatedAt: '2026-01-01T10:00:00.000Z',
}

function ok(data: unknown, meta: Record<string, unknown> = {}, status = 200) {
	return { ok: true, status, json: async () => ({ data, meta }) } as unknown as Response
}

function fail(status: number, code: string, message: string) {
	return {
		ok: false,
		status,
		json: async () => ({ error: { code, message } }),
	} as unknown as Response
}

describe('item comment commands', () => {
	let logSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		logSpy.mockRestore()
		process.exitCode = undefined as unknown as number
	})

	const output = () => logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')

	describe('add', () => {
		it('POSTs the --body text', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(ok(comment, {}, 201))

			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_abc', { body: 'Hello' }, { json: true })

			expect(apiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc/comments', {
				method: 'POST',
				body: JSON.stringify({ body: 'Hello' }),
			})
			expect(JSON.parse(output()).data.id).toBe('cmt_abc')
		})

		it('reads long text from --body-file', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(ok(comment, {}, 201))
			const dir = mkdtempSync(join(tmpdir(), 'kbb-comment-'))
			const file = join(dir, 'body.md')
			writeFileSync(file, '# Update\n\nLine 1\nLine 2\n')

			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_abc', { bodyFile: file }, { json: true })

			expect(apiRequest).toHaveBeenCalledWith('/api/v1/items/itm_abc/comments', {
				method: 'POST',
				body: JSON.stringify({ body: '# Update\n\nLine 1\nLine 2\n' }),
			})
		})

		it('errors when neither --body nor --body-file is given', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_abc', {}, { json: true })

			expect(apiRequest).not.toHaveBeenCalled()
			expect(process.exitCode).toBe(1)
			expect(output()).toContain('NO_BODY')
		})

		it('errors when both --body and --body-file are given', async () => {
			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_abc', { body: 'a', bodyFile: 'b.txt' }, { json: true })

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('INVALID_ARGS')
		})

		it('errors on an unreadable --body-file', async () => {
			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_abc', { bodyFile: '/nonexistent/kbb.txt' }, { json: true })

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('BODY_FILE_ERROR')
		})

		it('errors on a blank body', async () => {
			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_abc', { body: '   ' }, { json: true })

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('EMPTY_BODY')
		})

		it('reports a missing item', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(fail(404, 'NOT_FOUND', 'Item not found'))

			const { itemCommentAddCommand } = await import('../add.js')
			await itemCommentAddCommand('itm_nope', { body: 'x' }, { json: true })

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('NOT_FOUND')
		})
	})

	describe('list', () => {
		it('follows the cursor and returns every comment in order', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest)
				.mockResolvedValueOnce(ok([comment], { total: 2, cursor: 'next' }))
				.mockResolvedValueOnce(ok([{ ...comment, id: 'cmt_def' }], { total: 2, cursor: null }))

			const { itemCommentListCommand } = await import('../list.js')
			await itemCommentListCommand('itm_abc', { json: true })

			expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/v1/items/itm_abc/comments?limit=100')
			expect(apiRequest).toHaveBeenNthCalledWith(
				2,
				'/api/v1/items/itm_abc/comments?limit=100&cursor=next',
			)
			const parsed = JSON.parse(output())
			expect(parsed.data.map((c: { id: string }) => c.id)).toEqual(['cmt_abc', 'cmt_def'])
			expect(parsed.meta.total).toBe(2)
		})

		it('prints author, time, id and body in plain mode', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(ok([comment], { total: 1, cursor: null }))

			const { itemCommentListCommand } = await import('../list.js')
			await itemCommentListCommand('itm_abc', {})

			expect(output()).toContain('agent@example.com · 2026-01-01 10:00 · cmt_abc')
			expect(output()).toContain('Hello')
		})

		it('strips terminal control sequences from printed comments but not from --json', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			const evil = {
				...comment,
				authorEmail: 'a\u001b]0;x\u0007@example.com',
				body: 'hi\u001b[2J\u001b]52;c;ZXZpbA==\u0007 there\u0007\nline2',
			}
			vi.mocked(apiRequest).mockResolvedValueOnce(ok([evil], { total: 1, cursor: null }))

			const { itemCommentListCommand } = await import('../list.js')
			await itemCommentListCommand('itm_abc', {})

			expect(output()).toContain('a@example.com')
			expect(output()).toContain('hi there\nline2')
			expect(output()).not.toContain('\u001b')
			expect(output()).not.toContain('\u0007')

			logSpy.mockClear()
			vi.mocked(apiRequest).mockResolvedValueOnce(ok([evil], { total: 1, cursor: null }))
			await itemCommentListCommand('itm_abc', { json: true })
			expect(JSON.parse(output()).data[0].body).toBe(evil.body)
		})

		it('prints an empty message when there are no comments', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(ok([], { total: 0, cursor: null }))

			const { itemCommentListCommand } = await import('../list.js')
			await itemCommentListCommand('itm_abc', {})

			expect(output()).toContain('No comments yet')
		})
	})

	describe('edit', () => {
		it('PATCHes the new body', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(ok({ ...comment, body: 'Changed' }))

			const { itemCommentEditCommand } = await import('../edit.js')
			await itemCommentEditCommand('cmt_abc', { body: 'Changed' }, { json: true })

			expect(apiRequest).toHaveBeenCalledWith('/api/v1/comments/cmt_abc', {
				method: 'PATCH',
				body: JSON.stringify({ body: 'Changed' }),
			})
		})

		it('surfaces a 403 from a non-author', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(
				fail(403, 'FORBIDDEN', 'Only the author can edit this comment'),
			)

			const { itemCommentEditCommand } = await import('../edit.js')
			await itemCommentEditCommand('cmt_abc', { body: 'x' }, {})

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('Only the author can edit this comment')
		})

		it('requires a body', async () => {
			const { itemCommentEditCommand } = await import('../edit.js')
			await itemCommentEditCommand('cmt_abc', {}, { json: true })

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('NO_BODY')
		})
	})

	describe('delete', () => {
		it('deletes with --force and no confirmation', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			const { confirm } = await import('../../../../lib/confirm.js')
			vi.mocked(apiRequest).mockResolvedValueOnce({ ok: true, status: 204 } as unknown as Response)

			const { itemCommentDeleteCommand } = await import('../delete.js')
			await itemCommentDeleteCommand('cmt_abc', { force: true }, { json: true })

			expect(confirm).not.toHaveBeenCalled()
			expect(apiRequest).toHaveBeenCalledWith('/api/v1/comments/cmt_abc', { method: 'DELETE' })
			expect(JSON.parse(output()).data).toEqual({ deleted: true, id: 'cmt_abc' })
		})

		it('does not delete when confirmation is declined', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			const { confirm } = await import('../../../../lib/confirm.js')
			vi.mocked(confirm).mockResolvedValueOnce(false)

			const { itemCommentDeleteCommand } = await import('../delete.js')
			await itemCommentDeleteCommand('cmt_abc', {}, { json: true })

			expect(apiRequest).not.toHaveBeenCalled()
		})

		it('reports a 404', async () => {
			const { apiRequest } = await import('../../../../lib/api-client.js')
			vi.mocked(apiRequest).mockResolvedValueOnce(fail(404, 'NOT_FOUND', 'Comment not found'))

			const { itemCommentDeleteCommand } = await import('../delete.js')
			await itemCommentDeleteCommand('cmt_nope', { force: true }, {})

			expect(process.exitCode).toBe(1)
			expect(output()).toContain('Comment not found')
		})
	})
})
