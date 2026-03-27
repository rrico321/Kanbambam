'use client'

import { useDroppable } from '@dnd-kit/react'
import type { Column as ColumnType, Item } from '@kanbambam/shared'
import { Card } from './Card'
import { AddItemForm } from './AddItemForm'

interface ColumnProps {
	column: ColumnType
	items: Item[]
	onCardClick: (item: Item) => void
}

export function Column({ column, items, onCardClick }: ColumnProps) {
	const { ref: droppableRef, isDropTarget } = useDroppable({
		id: column.id,
		type: 'column',
		accept: ['item'],
	})

	return (
		<div className="w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-2 flex flex-col max-h-full">
			{/* Header: name + count */}
			<div className="flex items-center justify-between px-2 py-2">
				<div className="flex items-center gap-1">
					<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
						{column.name}
					</h3>
					<span className="text-xs text-gray-400">{items.length}</span>
				</div>
			</div>

			{/* Card list */}
			<div
				ref={droppableRef}
				className={`flex-1 overflow-y-auto flex flex-col gap-2 min-h-[2px] ${
					isDropTarget
						? 'border-2 border-dashed border-blue-400 rounded-lg'
						: ''
				}`}
			>
				{items.length === 0 ? (
					<p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
						No items
					</p>
				) : (
					items.map((item, index) => (
						<Card
							key={item.id}
							item={item}
							index={index}
							column={column.id}
							onClick={() => onCardClick(item)}
						/>
					))
				)}
			</div>

			{/* Add item form at bottom */}
			<div className="mt-1">
				<AddItemForm columnId={column.id} />
			</div>
		</div>
	)
}
