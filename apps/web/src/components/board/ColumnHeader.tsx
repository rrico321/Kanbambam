'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRenameColumn, useDeleteColumn } from '@/hooks/use-api'
import type { Column } from '@kanbambam/shared'

interface ColumnHeaderProps {
	column: Column
	itemCount: number
}

export function ColumnHeader({ column, itemCount }: ColumnHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [isRenaming, setIsRenaming] = useState(false)
	const [name, setName] = useState(column.name)
	const renameColumn = useRenameColumn()
	const deleteColumn = useDeleteColumn()

	const handleRename = () => {
		if (name.trim() && name.trim() !== column.name) {
			renameColumn.mutate({ id: column.id, name: name.trim() })
		} else {
			setName(column.name)
		}
		setIsRenaming(false)
	}

	return (
		<div className="flex items-center justify-between px-2 py-2">
			<div className="flex items-center gap-1 flex-1 min-w-0">
				{isRenaming ? (
					<input
						autoFocus
						value={name}
						onChange={(e) => setName(e.target.value)}
						onBlur={handleRename}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleRename()
							if (e.key === 'Escape') {
								setName(column.name)
								setIsRenaming(false)
							}
						}}
						className="text-sm font-semibold w-full border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
					/>
				) : (
					<>
						<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
							{column.name}
						</h3>
						<span className="text-xs text-gray-400">{itemCount}</span>
					</>
				)}
			</div>

			<div className="relative">
				<button
					onClick={() => setMenuOpen(!menuOpen)}
					className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					<MoreHorizontal className="w-4 h-4" />
				</button>

				{menuOpen && (
					<div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 w-36 py-1">
						<button
							onClick={() => {
								setIsRenaming(true)
								setMenuOpen(false)
							}}
							className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<Pencil className="w-3.5 h-3.5" /> Rename
						</button>
						<button
							onClick={() => {
								deleteColumn.mutate(column.id)
								setMenuOpen(false)
							}}
							className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<Trash2 className="w-3.5 h-3.5" /> Delete
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
