'use client'

import { Sidebar } from '@/components/sidebar/Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
			<Sidebar />
			<main className="flex-1 overflow-auto">{children}</main>
		</div>
	)
}
