'use client'

import { Calendar } from 'lucide-react'

interface DueDatePickerProps {
	value: string | null
	onSave: (value: string | null) => void
}

function getDueDateColor(dueDate: string): string {
	const today = new Date().toISOString().slice(0, 10)
	const due = dueDate.slice(0, 10)
	if (due < today) return 'text-red-600 dark:text-red-400'
	if (due === today) return 'text-yellow-600 dark:text-yellow-400'
	return 'text-gray-600 dark:text-gray-300'
}

export function DueDatePicker({ value, onSave }: DueDatePickerProps) {
	const displayDate = value?.slice(0, 10) ?? ''

	return (
		<div className="flex items-center gap-2">
			<Calendar className="w-4 h-4 text-gray-400" />
			<input
				type="date"
				value={displayDate}
				onChange={(e) => {
					const val = e.target.value
					onSave(val ? new Date(`${val}T00:00:00.000Z`).toISOString() : null)
				}}
				className={`border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 ${
					value ? getDueDateColor(value) : 'text-gray-400'
				}`}
			/>
			{value && (
				<button
					onClick={() => onSave(null)}
					className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
				>
					Clear
				</button>
			)}
		</div>
	)
}
