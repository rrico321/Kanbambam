'use client'

import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { getLabelStyle } from '@/lib/labels'

interface LabelPickerProps {
	labels: string[]
	onSave: (labels: string[] | null) => void
}

export function LabelPicker({ labels, onSave }: LabelPickerProps) {
	const [inputValue, setInputValue] = useState('')
	const [isAdding, setIsAdding] = useState(false)

	const addLabel = (name: string) => {
		const trimmed = name.trim()
		if (!trimmed || labels.includes(trimmed)) return
		onSave([...labels, trimmed])
		setInputValue('')
	}

	const removeLabel = (name: string) => {
		const updated = labels.filter((l) => l !== name)
		onSave(updated.length > 0 ? updated : null)
	}

	return (
		<div>
			<div className="flex flex-wrap items-center gap-1.5">
				{labels.map((label) => {
					const style = getLabelStyle(label)
					return (
						<span
							key={label}
							className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.darkBg} ${style.text}`}
						>
							{label}
							<button
								onClick={() => removeLabel(label)}
								className="hover:opacity-70"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					)
				})}
				{!isAdding && (
					<button
						onClick={() => setIsAdding(true)}
						className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-1"
					>
						<Tag className="w-3 h-3" />
						{labels.length === 0 ? 'Add labels' : 'Add'}
					</button>
				)}
			</div>

			{isAdding && (
				<div className="mt-2 flex gap-1">
					<input
						autoFocus
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
								addLabel(inputValue)
							}
							if (e.key === 'Escape') {
								setInputValue('')
								setIsAdding(false)
							}
						}}
						placeholder="Label name..."
						className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
					<button
						onClick={() => {
							addLabel(inputValue)
						}}
						disabled={!inputValue.trim()}
						className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
					>
						Add
					</button>
					<button
						onClick={() => {
							setInputValue('')
							setIsAdding(false)
						}}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs px-1"
					>
						Done
					</button>
				</div>
			)}
		</div>
	)
}
