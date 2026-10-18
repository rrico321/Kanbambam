'use client'

import { COMMENT_BODY_MAX_LENGTH, type Comment } from '@kanbambam/shared'
import { useState } from 'react'
import { useAddComment, useComments, useDeleteComment, useUpdateComment } from '@/hooks/use-api'
import { relativeTime } from '@/lib/relative-time'

const textareaClass =
	'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y'

function CommentRow({ comment, itemId }: { comment: Comment; itemId: string }) {
	const update = useUpdateComment(itemId)
	const remove = useDeleteComment(itemId)
	const [editing, setEditing] = useState(false)
	const [confirming, setConfirming] = useState(false)
	const [draft, setDraft] = useState(comment.body)
	const edited = comment.updatedAt !== comment.createdAt

	const save = () => {
		const trimmed = draft.trim()
		if (!trimmed || trimmed === comment.body) {
			setDraft(comment.body)
			setEditing(false)
			return
		}
		update.mutate({ id: comment.id, body: trimmed }, { onSuccess: () => setEditing(false) })
	}

	return (
		<li className="text-sm" data-testid="comment">
			<div className="flex items-baseline gap-2">
				<span className="font-semibold text-gray-800 dark:text-gray-200">
					{comment.authorEmail}
				</span>
				<time
					dateTime={comment.createdAt}
					title={new Date(comment.createdAt).toLocaleString()}
					className="text-xs text-gray-500 dark:text-gray-400"
				>
					{relativeTime(comment.createdAt)}
					{edited && ' (edited)'}
				</time>
			</div>

			{editing ? (
				<div className="mt-1 space-y-2">
					<textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						maxLength={COMMENT_BODY_MAX_LENGTH}
						rows={3}
						aria-label="Edit comment"
						className={textareaClass}
					/>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={save}
							disabled={update.isPending || !draft.trim()}
							className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
						>
							Save
						</button>
						<button
							type="button"
							onClick={() => {
								setDraft(comment.body)
								setEditing(false)
							}}
							className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<p className="mt-0.5 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
					{comment.body}
				</p>
			)}

			{!editing && (
				<div className="mt-1 flex items-center gap-3 text-xs">
					{confirming ? (
						<>
							<span className="text-gray-600 dark:text-gray-300">Delete this comment?</span>
							<button
								type="button"
								onClick={() => remove.mutate(comment.id)}
								disabled={remove.isPending}
								className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
							>
								{remove.isPending ? 'Deleting...' : 'Delete'}
							</button>
							<button
								type="button"
								onClick={() => setConfirming(false)}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								Cancel
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => setEditing(true)}
								className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
							>
								Edit
							</button>
							<button
								type="button"
								onClick={() => setConfirming(true)}
								className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
							>
								Delete
							</button>
						</>
					)}
				</div>
			)}
		</li>
	)
}

export function CommentThread({ itemId }: { itemId: string }) {
	const { comments, isLoading, isError, hasOlder, loadOlder, isLoadingOlder } = useComments(itemId)
	const add = useAddComment(itemId)
	const [draft, setDraft] = useState('')

	const submit = () => {
		const body = draft.trim()
		if (!body) return
		add.mutate(body, { onSuccess: () => setDraft('') })
	}

	return (
		<div>
			<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
				Comments
				{comments && comments.length > 0 ? ` (${comments.length}${hasOlder ? '+' : ''})` : ''}
			</h3>

			{isLoading && <p className="text-sm text-gray-400">Loading comments...</p>}
			{isError && (
				<p className="text-sm text-red-600 dark:text-red-400">Failed to load comments.</p>
			)}
			{comments && comments.length === 0 && (
				<p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">No comments yet.</p>
			)}
			{hasOlder && (
				<button
					type="button"
					onClick={loadOlder}
					disabled={isLoadingOlder}
					className="mb-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
				>
					{isLoadingOlder ? 'Loading...' : 'Load older comments'}
				</button>
			)}
			{comments && comments.length > 0 && (
				<ul className="space-y-4 mb-4">
					{comments.map((c) => (
						<CommentRow key={c.id} comment={c} itemId={itemId} />
					))}
				</ul>
			)}

			<div className="space-y-2">
				<textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
					}}
					maxLength={COMMENT_BODY_MAX_LENGTH}
					rows={3}
					placeholder="Write a comment..."
					aria-label="New comment"
					className={textareaClass}
				/>
				<button
					type="button"
					onClick={submit}
					disabled={add.isPending || !draft.trim()}
					className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{add.isPending ? 'Posting...' : 'Comment'}
				</button>
			</div>
		</div>
	)
}
