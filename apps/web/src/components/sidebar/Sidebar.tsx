'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { WorkspaceTree } from './WorkspaceTree'
import { SidebarToggle } from './SidebarToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useCreateWorkspace } from '@/hooks/use-api'

export function Sidebar() {
	const [collapsed, setCollapsed] = useState(false)
	const createWs = useCreateWorkspace()
	const [showNewWs, setShowNewWs] = useState(false)
	const [newWsName, setNewWsName] = useState('')

	return (
		<aside
			className={`relative flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ${
				collapsed ? 'w-12' : 'w-64'
			}`}
		>
			<SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

			{!collapsed && (
				<>
					<div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
						<a href="/workspaces" className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
							Kanbambam
						</a>
					</div>

					<div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
						<span className="text-xs font-semibold text-gray-400 uppercase">
							Workspaces
						</span>
						<button
							onClick={() => setShowNewWs(true)}
							className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							title="New workspace"
						>
							<Plus className="w-3.5 h-3.5" />
						</button>
					</div>
					{showNewWs && (
						<form
							onSubmit={async (e) => {
								e.preventDefault()
								if (!newWsName.trim()) return
								await createWs.mutateAsync(newWsName.trim())
								setNewWsName('')
								setShowNewWs(false)
							}}
							className="px-4 py-2 border-b border-gray-200 dark:border-gray-700"
						>
							<input
								autoFocus
								value={newWsName}
								onChange={(e) => setNewWsName(e.target.value)}
								placeholder="Workspace name..."
								className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
								onKeyDown={(e) => {
									if (e.key === 'Escape') {
										setNewWsName('')
										setShowNewWs(false)
									}
								}}
							/>
						</form>
					)}

					<div className="flex-1 overflow-y-auto">
						<WorkspaceTree />
					</div>

					<div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
						<a
							href="/auth/logout"
							className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
						>
							Log out
						</a>
						<ThemeToggle />
					</div>
				</>
			)}
		</aside>
	)
}
