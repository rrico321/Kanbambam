'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaces, useCreateWorkspace } from '@/hooks/use-api'
import { AppShell } from '@/components/layout/AppShell'
import { Plus, LayoutDashboard } from 'lucide-react'

export function HomeRedirect() {
	const router = useRouter()
	const [checked, setChecked] = useState(false)
	const { data: workspaces, isLoading } = useWorkspaces()
	const createWs = useCreateWorkspace()

	useEffect(() => {
		const lastBoard = localStorage.getItem('kanbambam_last_board')
		if (lastBoard) {
			router.replace(`/boards/${lastBoard}`)
		} else {
			setChecked(true)
		}
	}, [router])

	if (!checked || isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="text-gray-400 animate-pulse">Loading...</div>
			</div>
		)
	}

	// If user has workspaces, redirect to workspace list
	if (workspaces && workspaces.length > 0) {
		router.replace('/workspaces')
		return null
	}

	// Empty state — no workspaces yet
	return (
		<AppShell>
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center max-w-md mx-auto px-6">
					<div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
						<LayoutDashboard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
					</div>
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
						Welcome to Kanbambam
					</h1>
					<p className="text-gray-500 dark:text-gray-400 mb-8">
						Create your first workspace to start organizing your projects with Kanban boards.
					</p>
					<button
						onClick={async () => {
							const result = await createWs.mutateAsync('My Workspace')
							if (result?.data?.id) {
								router.push(`/workspaces/${result.data.id}`)
							} else {
								router.push('/workspaces')
							}
						}}
						disabled={createWs.isPending}
						className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
					>
						<Plus className="w-5 h-5" />
						{createWs.isPending ? 'Creating...' : 'Create your first workspace'}
					</button>
				</div>
			</div>
		</AppShell>
	)
}
