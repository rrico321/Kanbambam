'use client'

import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { useBoards, useCreateBoard } from '@/hooks/use-api'
import { EmptyState } from '@/components/ui/EmptyState'
import { SidebarSkeleton } from '@/components/ui/LoadingSkeleton'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export default function WorkspaceDetailPage() {
	const params = useParams()
	const workspaceId = params.workspaceId as string
	const { data: boards, isLoading } = useBoards(workspaceId)
	const createBoard = useCreateBoard()
	const [name, setName] = useState('')
	const router = useRouter()

	if (isLoading)
		return (
			<AppShell>
				<SidebarSkeleton />
			</AppShell>
		)

	return (
		<AppShell>
			<div className="max-w-2xl mx-auto py-12 px-6">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Boards
					</h1>
					<form
						className="flex gap-2"
						onSubmit={async (e) => {
							e.preventDefault()
							if (!name.trim()) return
							await createBoard.mutateAsync({ workspaceId, name: name.trim() })
							setName('')
						}}
					>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="New board"
							className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
						<button
							type="submit"
							disabled={createBoard.isPending}
							className="flex items-center gap-1 bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
						>
							<Plus className="w-4 h-4" /> New board
						</button>
					</form>
				</div>

				{!boards || boards.length === 0 ? (
					<EmptyState
						heading="No boards yet"
						body="Create your first board to start managing tasks."
					/>
				) : (
					<div className="grid gap-3">
						{boards.map((board) => (
							<button
								key={board.id}
								onClick={() => router.push(`/boards/${board.id}`)}
								className="text-left p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
							>
								<h2 className="font-semibold text-gray-900 dark:text-gray-100">{board.name}</h2>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									Created {new Date(board.createdAt).toLocaleDateString()}
								</p>
							</button>
						))}
					</div>
				)}
			</div>
		</AppShell>
	)
}
