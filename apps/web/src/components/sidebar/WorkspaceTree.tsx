'use client'

import { useState } from 'react'
import {
	useWorkspaces,
	useBoards,
	useCreateBoard,
	useRenameWorkspace,
	useDeleteWorkspace,
	useRenameBoard,
	useDeleteBoard,
} from '@/hooks/use-api'
import { SidebarSkeleton } from '@/components/ui/LoadingSkeleton'
import {
	ChevronRight,
	ChevronDown,
	LayoutDashboard,
	Plus,
	MoreHorizontal,
	Pencil,
	Trash2,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

function WorkspaceSection({ workspace }: { workspace: { id: string; name: string } }) {
	const [expanded, setExpanded] = useState(true)
	const [wsMenuOpen, setWsMenuOpen] = useState(false)
	const [isRenamingWs, setIsRenamingWs] = useState(false)
	const [wsName, setWsName] = useState(workspace.name)
	const [showNewBoard, setShowNewBoard] = useState(false)
	const [newBoardName, setNewBoardName] = useState('')
	const [boardMenuOpen, setBoardMenuOpen] = useState<string | null>(null)
	const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null)
	const [boardNameDraft, setBoardNameDraft] = useState('')

	const { data: boards, isLoading } = useBoards(workspace.id)
	const router = useRouter()
	const params = useParams()
	const activeBoardId = params?.boardId as string | undefined

	const renameWs = useRenameWorkspace()
	const deleteWs = useDeleteWorkspace()
	const createBoard = useCreateBoard()
	const renameBoard = useRenameBoard()
	const deleteBoard = useDeleteBoard()

	const handleRenameWs = () => {
		if (wsName.trim() && wsName.trim() !== workspace.name) {
			renameWs.mutate({ id: workspace.id, name: wsName.trim() })
		} else {
			setWsName(workspace.name)
		}
		setIsRenamingWs(false)
	}

	const handleCreateBoard = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newBoardName.trim()) return
		await createBoard.mutateAsync({ workspaceId: workspace.id, name: newBoardName.trim() })
		setNewBoardName('')
		setShowNewBoard(false)
	}

	const handleRenameBoard = (boardId: string, originalName: string) => {
		if (boardNameDraft.trim() && boardNameDraft.trim() !== originalName) {
			renameBoard.mutate({ id: boardId, name: boardNameDraft.trim() })
		}
		setRenamingBoardId(null)
		setBoardNameDraft('')
	}

	return (
		<div>
			{/* Workspace header with CRUD actions */}
			<div className="flex items-center justify-between w-full px-4 py-2 group relative">
				<button
					onClick={() => setExpanded(!expanded)}
					className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 flex-1 min-w-0"
				>
					{expanded ? (
						<ChevronDown className="w-3 h-3 flex-shrink-0" />
					) : (
						<ChevronRight className="w-3 h-3 flex-shrink-0" />
					)}
					{isRenamingWs ? (
						<input
							autoFocus
							value={wsName}
							onChange={(e) => setWsName(e.target.value)}
							onBlur={handleRenameWs}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleRenameWs()
								if (e.key === 'Escape') {
									setWsName(workspace.name)
									setIsRenamingWs(false)
								}
							}}
							onClick={(e) => e.stopPropagation()}
							className="text-xs font-semibold uppercase tracking-wider border border-gray-300 dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 w-full"
						/>
					) : (
						<span className="truncate">{workspace.name}</span>
					)}
				</button>
				<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={() => setShowNewBoard(true)}
						className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						title="Add board"
					>
						<Plus className="w-3 h-3" />
					</button>
					<button
						onClick={() => setWsMenuOpen(!wsMenuOpen)}
						className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<MoreHorizontal className="w-3 h-3" />
					</button>
				</div>
				{wsMenuOpen && (
					<div className="absolute right-2 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 w-32 py-1">
						<button
							onClick={() => {
								setIsRenamingWs(true)
								setWsMenuOpen(false)
							}}
							className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<Pencil className="w-3 h-3" /> Rename
						</button>
						<button
							onClick={() => {
								deleteWs.mutate(workspace.id)
								setWsMenuOpen(false)
							}}
							className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<Trash2 className="w-3 h-3" /> Delete
						</button>
					</div>
				)}
			</div>

			{/* New board form */}
			{showNewBoard && (
				<form onSubmit={handleCreateBoard} className="px-6 py-1">
					<input
						autoFocus
						value={newBoardName}
						onChange={(e) => setNewBoardName(e.target.value)}
						placeholder="Board name..."
						className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								setNewBoardName('')
								setShowNewBoard(false)
							}
						}}
					/>
				</form>
			)}

			{/* Board list */}
			{expanded && (
				<div className="ml-2">
					{isLoading ? (
						<div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mx-4 my-2" />
					) : boards && boards.length > 0 ? (
						boards.map((board) => (
							<div key={board.id} className="group/board relative">
								{renamingBoardId === board.id ? (
									<div className="px-4 py-2">
										<input
											autoFocus
											value={boardNameDraft}
											onChange={(e) => setBoardNameDraft(e.target.value)}
											onBlur={() => handleRenameBoard(board.id, board.name)}
											onKeyDown={(e) => {
												if (e.key === 'Enter')
													handleRenameBoard(board.id, board.name)
												if (e.key === 'Escape') {
													setRenamingBoardId(null)
													setBoardNameDraft('')
												}
											}}
											className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
										/>
									</div>
								) : (
									<div className="flex items-center">
										<button
											onClick={() => {
												localStorage.setItem('kanbambam_last_board', board.id)
												router.push(`/boards/${board.id}`)
											}}
											className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-md text-sm ${
												activeBoardId === board.id
													? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
													: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
											}`}
										>
											<LayoutDashboard className="w-4 h-4" />
											{board.name}
										</button>
										<div className="relative">
											<button
												onClick={() =>
													setBoardMenuOpen(
														boardMenuOpen === board.id ? null : board.id,
													)
												}
												className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover/board:opacity-100 transition-opacity mr-2"
											>
												<MoreHorizontal className="w-3.5 h-3.5" />
											</button>
											{boardMenuOpen === board.id && (
												<div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 w-32 py-1">
													<button
														onClick={() => {
															setRenamingBoardId(board.id)
															setBoardNameDraft(board.name)
															setBoardMenuOpen(null)
														}}
														className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
													>
														<Pencil className="w-3 h-3" /> Rename
													</button>
													<button
														onClick={() => {
															deleteBoard.mutate(board.id)
															setBoardMenuOpen(null)
														}}
														className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
													>
														<Trash2 className="w-3 h-3" /> Delete
													</button>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
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
