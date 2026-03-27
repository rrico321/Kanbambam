'use client'

import { useState, useMemo } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { Plus } from 'lucide-react'
import { useBoardData } from '@/hooks/use-board-data'
import { useOptimisticMove } from '@/hooks/use-optimistic-move'
import { useCreateColumn } from '@/hooks/use-api'
import { Column } from './Column'
import { BoardSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ItemModal } from '@/components/item-detail/ItemModal'

interface BoardViewProps {
	boardId: string
}

function AddColumnButton({ boardId }: { boardId: string }) {
	const createColumn = useCreateColumn()
	const [isAdding, setIsAdding] = useState(false)
	const [name, setName] = useState('')

	if (!isAdding) {
		return (
			<button
				onClick={() => setIsAdding(true)}
				className="w-[280px] flex-shrink-0 h-12 flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-400 transition-colors"
			>
				<Plus className="w-4 h-4" /> Add column
			</button>
		)
	}

	return (
		<div className="w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3">
			<form
				onSubmit={async (e) => {
					e.preventDefault()
					if (!name.trim()) return
					await createColumn.mutateAsync({ boardId, name: name.trim() })
					setName('')
					setIsAdding(false)
				}}
			>
				<input
					autoFocus
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Column name..."
					className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							setName('')
							setIsAdding(false)
						}
					}}
				/>
				<div className="flex gap-1 mt-2">
					<button
						type="submit"
						disabled={createColumn.isPending || !name.trim()}
						className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
					>
						Add
					</button>
					<button
						type="button"
						onClick={() => {
							setName('')
							setIsAdding(false)
						}}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs px-2"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	)
}

export function BoardView({ boardId }: BoardViewProps) {
	const { columns, itemsByColumn, isLoading, error } = useBoardData(boardId)
	const {
		items: optimisticItems,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	} = useOptimisticMove(columns, itemsByColumn)
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

	// Look up the live item from query data so modal always shows fresh data
	const selectedItem = useMemo(() => {
		if (!selectedItemId) return null
		for (const items of Object.values(optimisticItems)) {
			const found = items.find((it) => it.id === selectedItemId)
			if (found) return found
		}
		return null
	}, [selectedItemId, optimisticItems])

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
			<div className="flex flex-col items-center justify-center h-full gap-6">
				<EmptyState
					heading="This board has no columns"
					body="Add a column to start organizing items."
				/>
				<AddColumnButton boardId={boardId} />
			</div>
		)
	}

	return (
		<>
			<DragDropProvider
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<div className="flex gap-4 overflow-x-auto px-6 py-4 h-full items-start">
					{columns.map((col) => (
						<Column
							key={col.id}
							column={col}
							items={optimisticItems[col.id] ?? []}
							onCardClick={(item) => setSelectedItemId(item.id)}
						/>
					))}
					{/* Add column button per D-17 */}
					<AddColumnButton boardId={boardId} />
				</div>
			</DragDropProvider>

			<ItemModal item={selectedItem} onClose={() => setSelectedItemId(null)} />
		</>
	)
}
