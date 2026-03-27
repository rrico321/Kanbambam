'use client'

import { useState } from 'react'
import type { Item } from '@kanbambam/shared'
import { useBoardData } from '@/hooks/use-board-data'
import { Column } from './Column'
import { BoardSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface BoardViewProps {
	boardId: string
}

export function BoardView({ boardId }: BoardViewProps) {
	const { columns, itemsByColumn, isLoading, error } = useBoardData(boardId)
	const [_selectedItem, setSelectedItem] = useState<Item | null>(null)

	if (isLoading) return <BoardSkeleton />

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-red-600 dark:text-red-400">
					Something went wrong. Please try again.
				</p>
			</div>
		)
	}

	if (columns.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<EmptyState
					heading="This board has no columns"
					body="Add a column to start organizing items."
				/>
			</div>
		)
	}

	return (
		<>
			<div className="flex gap-4 overflow-x-auto px-6 py-4 h-full items-start">
				{columns.map((col) => (
					<Column
						key={col.id}
						column={col}
						items={itemsByColumn[col.id] ?? []}
						onCardClick={(item) => setSelectedItem(item)}
					/>
				))}
			</div>

			{/* Item detail modal will be wired in Plan 05 */}
		</>
	)
}
