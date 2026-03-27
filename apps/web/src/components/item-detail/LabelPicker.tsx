'use client'

import { useState } from 'react'
import { Tag } from 'lucide-react'
import { LABEL_COLORS, getLabelStyle } from '@/lib/labels'

interface LabelPickerProps {
	labels: string[]
	onSave: (labels: string[] | null) => void
}

export function LabelPicker({ labels, onSave }: LabelPickerProps) {
	const [open, setOpen] = useState(false)

	const toggleLabel = (name: string) => {
		const current = [...labels]
		const idx = current.indexOf(name)
		if (idx >= 0) {
			current.splice(idx, 1)
		} else {
			current.push(name)
		}
		onSave(current.length > 0 ? current : null)
	}

	return (
		<div className="relative">
			<div className="flex flex-wrap items-center gap-1">
				{labels.map((label) => {
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
				<button
					onClick={() => setOpen(!open)}
					className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-1"
				>
					<Tag className="w-3 h-3" />
					{labels.length === 0 ? 'Add labels' : 'Edit'}
				</button>
			</div>

			{open && (
				<div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10 w-48">
					<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
						Labels
					</p>
					<div className="space-y-1">
						{LABEL_COLORS.map((color) => {
							const isSelected = labels.includes(color.name)
							return (
								<button
									key={color.name}
									onClick={() => toggleLabel(color.name)}
									className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
										isSelected ? 'ring-2 ring-blue-500' : ''
									}`}
								>
									<span className={`w-6 h-4 rounded ${color.bg} ${color.darkBg}`} />
									<span className="text-gray-700 dark:text-gray-300 capitalize">
										{color.name}
									</span>
								</button>
							)
						})}
					</div>
					<button
						onClick={() => setOpen(false)}
						className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-full text-center"
					>
						Done
					</button>
				</div>
			)}
		</div>
	)
}
