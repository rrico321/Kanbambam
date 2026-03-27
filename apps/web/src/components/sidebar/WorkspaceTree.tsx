'use client'

import { useState } from 'react'
import { useWorkspaces, useBoards } from '@/hooks/use-api'
import { SidebarSkeleton } from '@/components/ui/LoadingSkeleton'
import { ChevronRight, ChevronDown, LayoutDashboard } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

function WorkspaceSection({ workspace }: { workspace: { id: string; name: string } }) {
	const [expanded, setExpanded] = useState(true)
	const { data: boards, isLoading } = useBoards(workspace.id)
	const router = useRouter()
	const params = useParams()
	const activeBoardId = params?.boardId as string | undefined

	return (
		<div>
			<button
				onClick={() => setExpanded(!expanded)}
				className="flex items-center gap-1 w-full px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300"
			>
				{expanded ? (
					<ChevronDown className="w-3 h-3" />
				) : (
					<ChevronRight className="w-3 h-3" />
				)}
				{workspace.name}
			</button>
			{expanded && (
				<div className="ml-2">
					{isLoading ? (
						<div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mx-4 my-2" />
					) : boards && boards.length > 0 ? (
						boards.map((board) => (
							<button
								key={board.id}
								onClick={() => {
									localStorage.setItem('kanbambam_last_board', board.id)
									router.push(`/boards/${board.id}`)
								}}
								className={`flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm ${
									activeBoardId === board.id
										? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
										: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
								}`}
							>
								<LayoutDashboard className="w-4 h-4" />
								{board.name}
							</button>
						))
					) : (
						<p className="px-4 py-2 text-xs text-gray-400">No boards</p>
					)}
				</div>
			)}
		</div>
	)
}

export function WorkspaceTree() {
	const { data: workspaces, isLoading } = useWorkspaces()

	if (isLoading) return <SidebarSkeleton />
	if (!workspaces || workspaces.length === 0) {
		return (
			<p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">
				No workspaces
			</p>
		)
	}

	return (
		<nav className="py-2 space-y-1">
			{workspaces.map((ws) => (
				<WorkspaceSection key={ws.id} workspace={ws} />
			))}
		</nav>
	)
}
