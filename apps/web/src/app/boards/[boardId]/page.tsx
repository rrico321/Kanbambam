'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default function BoardPage() {
	const params = useParams()
	const boardId = params.boardId as string

	return (
		<AppShell>
			<div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
				Board view for {boardId} (coming in Plan 03)
			</div>
		</AppShell>
	)
}
