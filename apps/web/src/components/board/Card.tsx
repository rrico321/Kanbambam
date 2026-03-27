'use client'

import { FileText, Calendar } from 'lucide-react'
import { useSortable } from '@dnd-kit/react/sortable'
import { getLabelStyle } from '@/lib/labels'
import type { Item } from '@kanbambam/shared'

interface CardProps {
	item: Item
	index: number
	column: string
	onClick: () => void
}

function getDueDateColor(dueDate: string): string {
	const today = new Date().toISOString().slice(0, 10)
	const due = dueDate.slice(0, 10)
	if (due < today) return 'text-red-600 dark:text-red-400' // overdue
	if (due === today) return 'text-yellow-600 dark:text-yellow-400' // today
	return 'text-gray-500 dark:text-gray-400' // future
}

export function Card({ item, index, column, onClick }: CardProps) {
	const { ref, isDragging } = useSortable({
		id: item.id,
		index,
		type: 'item',
		accept: ['item'],
		group: column,
	})

	return (
		<div
			ref={ref}
			onClick={!isDragging ? onClick : undefined}
			style={{ opacity: isDragging ? 0.5 : 1 }}
			className="w-full text-left bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow cursor-pointer"
		>
			<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
				{item.title}
			</p>

			{((item.labels && item.labels.length > 0) ||
				item.dueDate ||
				item.description) && (
				<div className="flex flex-wrap items-center gap-1 mt-2">
					{item.labels?.map((label) => {
						const style = getLabelStyle(label)
						return (
							<span
								key={label}
								className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.darkBg} ${style.text}`}
							>
								{label}
							</span>
						)
					})}
					{item.dueDate && (
						<span
							className={`flex items-center gap-0.5 text-xs ${getDueDateColor(item.dueDate)}`}
						>
							<Calendar className="w-3 h-3" />
							{item.dueDate.slice(0, 10)}
						</span>
					)}
					{item.description && (
						<FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
					)}
				</div>
			)}
		</div>
	)
}
