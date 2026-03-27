'use client'

import { PanelLeftClose, PanelLeft } from 'lucide-react'

interface SidebarToggleProps {
	collapsed: boolean
	onToggle: () => void
}

export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
	return (
		<button
			onClick={onToggle}
			className="absolute top-4 -right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{collapsed ? (
				<PanelLeft className="w-3.5 h-3.5" />
			) : (
				<PanelLeftClose className="w-3.5 h-3.5" />
			)}
		</button>
	)
}
