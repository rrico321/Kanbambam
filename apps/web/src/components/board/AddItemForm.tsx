'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useCreateItem } from '@/hooks/use-api'

interface AddItemFormProps {
	columnId: string
}

export function AddItemForm({ columnId }: AddItemFormProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [title, setTitle] = useState('')
	const createItem = useCreateItem()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!title.trim()) return
		await createItem.mutateAsync({ columnId, title: title.trim() })
		setTitle('')
		setIsOpen(false)
	}

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 w-full rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
			>
				<Plus className="w-4 h-4" /> Add item
			</button>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="p-2">
			<input
				autoFocus
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Item title..."
				className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setTitle('')
						setIsOpen(false)
					}
				}}
			/>
			<div className="flex gap-1 mt-1">
				<button
					type="submit"
					disabled={createItem.isPending || !title.trim()}
					className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
				>
					Add
				</button>
				<button
					type="button"
					onClick={() => {
						setTitle('')
						setIsOpen(false)
					}}
					className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</form>
	)
}
