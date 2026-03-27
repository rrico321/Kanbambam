'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { BoardView } from '@/components/board/BoardView'

export default function BoardPage() {
	const params = useParams()
	const boardId = params.boardId as string

	return (
		<AppShell>
			<BoardView boardId={boardId} />
		</AppShell>
	)
}
