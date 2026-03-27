'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
	onDelete: () => void
	isPending: boolean
}

export function DeleteButton({ onDelete, isPending }: DeleteButtonProps) {
	const [confirming, setConfirming] = useState(false)

	if (confirming) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-600 dark:text-gray-300">
					Are you sure? This cannot be undone.
				</span>
				<button
					onClick={onDelete}
					disabled={isPending}
					className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold disabled:opacity-50"
				>
					{isPending ? 'Deleting...' : 'Delete'}
				</button>
				<button
					onClick={() => setConfirming(false)}
					className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					Cancel
				</button>
			</div>
		)
	}

	return (
		<button
			onClick={() => setConfirming(true)}
			className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
		>
			<Trash2 className="w-4 h-4" /> Delete item
		</button>
	)
}
