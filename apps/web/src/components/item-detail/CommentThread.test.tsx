import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addMutate = vi.fn()
const updateMutate = vi.fn()
const deleteMutate = vi.fn()
const loadOlder = vi.fn()
let commentsState: {
	comments: unknown[] | undefined
	isLoading: boolean
	isError: boolean
	hasOlder: boolean
	loadOlder: () => void
	isLoadingOlder: boolean
}

vi.mock('@/hooks/use-api', () => ({
	useComments: () => commentsState,
	useAddComment: () => ({ mutate: addMutate, isPending: false }),
	useUpdateComment: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteComment: () => ({ mutate: deleteMutate, isPending: false }),
}))

import { CommentThread } from './CommentThread'

const base = {
	itemId: 'itm_1',
	authorId: 'usr_1',
	authorEmail: 'agent@example.com',
}

describe('CommentThread', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		commentsState = {
			comments: [],
			isLoading: false,
			isError: false,
			hasOlder: false,
			loadOlder,
			isLoadingOlder: false,
		}
	})

	it('shows an empty state', () => {
		render(<CommentThread itemId="itm_1" />)
		expect(screen.getByText('No comments yet.')).toBeInTheDocument()
	})

	it('renders author, relative time and body for each comment, in order', () => {
		const now = Date.now()
		commentsState.comments = [
			{
				...base,
				id: 'cmt_1',
				body: 'First update',
				createdAt: new Date(now - 5 * 60_000).toISOString(),
				updatedAt: new Date(now - 5 * 60_000).toISOString(),
			},
			{
				...base,
				id: 'cmt_2',
				body: 'Second update',
				createdAt: new Date(now - 2 * 3600_000).toISOString(),
				updatedAt: new Date(now - 60_000).toISOString(),
			},
		]
		render(<CommentThread itemId="itm_1" />)
		const rows = screen.getAllByTestId('comment')
		expect(rows).toHaveLength(2)
		expect(rows[0]).toHaveTextContent('agent@example.com')
		expect(rows[0]).toHaveTextContent('5 minutes ago')
		expect(rows[0]).toHaveTextContent('First update')
		expect(rows[1]).toHaveTextContent('2 hours ago')
		expect(rows[1]).toHaveTextContent('(edited)')
	})

	it('posts a trimmed comment and keeps the button disabled when empty', () => {
		render(<CommentThread itemId="itm_1" />)
		const button = screen.getByRole('button', { name: 'Comment' })
		expect(button).toBeDisabled()
		fireEvent.change(screen.getByLabelText('New comment'), { target: { value: '  hello  ' } })
		expect(button).not.toBeDisabled()
		fireEvent.click(button)
		expect(addMutate).toHaveBeenCalledWith('hello', expect.any(Object))
	})

	it('edits a comment', () => {
		const ts = new Date().toISOString()
		commentsState.comments = [{ ...base, id: 'cmt_1', body: 'Old', createdAt: ts, updatedAt: ts }]
		render(<CommentThread itemId="itm_1" />)
		fireEvent.click(screen.getByText('Edit'))
		fireEvent.change(screen.getByLabelText('Edit comment'), { target: { value: 'New' } })
		fireEvent.click(screen.getByText('Save'))
		expect(updateMutate).toHaveBeenCalledWith({ id: 'cmt_1', body: 'New' }, expect.any(Object))
	})

	it('asks for confirmation before deleting', () => {
		const ts = new Date().toISOString()
		commentsState.comments = [{ ...base, id: 'cmt_1', body: 'Bye', createdAt: ts, updatedAt: ts }]
		render(<CommentThread itemId="itm_1" />)
		fireEvent.click(screen.getByText('Delete'))
		expect(deleteMutate).not.toHaveBeenCalled()
		fireEvent.click(screen.getByText('Delete', { selector: 'button.font-semibold' }))
		expect(deleteMutate).toHaveBeenCalledWith('cmt_1')
	})

	it('offers to load older comments only when more exist', () => {
		const ts = new Date().toISOString()
		commentsState.comments = [
			{ ...base, id: 'cmt_1', body: 'Newest', createdAt: ts, updatedAt: ts },
		]
		const { rerender } = render(<CommentThread itemId="itm_1" />)
		expect(screen.queryByText('Load older comments')).not.toBeInTheDocument()

		commentsState.hasOlder = true
		rerender(<CommentThread itemId="itm_1" />)
		fireEvent.click(screen.getByText('Load older comments'))
		expect(loadOlder).toHaveBeenCalled()
		expect(screen.getByText('Comments (1+)')).toBeInTheDocument()
	})
})
