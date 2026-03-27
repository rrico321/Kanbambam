'use client'

import { useState } from 'react'
import { WorkspaceTree } from './WorkspaceTree'
import { SidebarToggle } from './SidebarToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function Sidebar() {
	const [collapsed, setCollapsed] = useState(false)

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
						<h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							Kanbambam
						</h1>
					</div>

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
