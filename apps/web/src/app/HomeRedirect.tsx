'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function HomeRedirect() {
	const router = useRouter()

	useEffect(() => {
		const lastBoard = localStorage.getItem('kanbambam_last_board')
		if (lastBoard) {
			router.replace(`/boards/${lastBoard}`)
		} else {
			router.replace('/workspaces')
		}
	}, [router])

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="text-gray-400 animate-pulse">Loading...</div>
		</div>
	)
}
