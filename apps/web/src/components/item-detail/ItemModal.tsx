'use client'

import type { Item } from '@kanbambam/shared'
import { Modal } from '@/components/ui/Modal'
import { EditableTitle } from './EditableTitle'
import { EditableDescription } from './EditableDescription'
import { LabelPicker } from './LabelPicker'
import { DueDatePicker } from './DueDatePicker'
import { DeleteButton } from './DeleteButton'
import { useUpdateItem, useDeleteItem } from '@/hooks/use-api'

interface ItemModalProps {
	item: Item | null
	onClose: () => void
}

export function ItemModal({ item, onClose }: ItemModalProps) {
	const updateItem = useUpdateItem()
	const deleteItem = useDeleteItem()

	if (!item) return null

	return (
		<Modal open={!!item} onClose={onClose}>
			<div className="space-y-6">
				{/* Title - D-10 click-to-edit */}
				<EditableTitle
					value={item.title}
					onSave={(title) => updateItem.mutate({ id: item.id, title })}
				/>

				{/* Description - D-10 click-to-edit */}
				<div>
					<label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
						Description
					</label>
					<EditableDescription
						value={item.description}
						onSave={(description) => updateItem.mutate({ id: item.id, description })}
					/>
				</div>

				{/* Labels - D-11 dropdown picker */}
				<div>
					<label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
						Labels
					</label>
					<LabelPicker
						labels={item.labels ?? []}
						onSave={(labels) => updateItem.mutate({ id: item.id, labels })}
					/>
				</div>

				{/* Due Date - D-12 calendar picker */}
				<div>
					<label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
						Due date
					</label>
					<DueDatePicker
						value={item.dueDate}
						onSave={(dueDate) => updateItem.mutate({ id: item.id, dueDate })}
					/>
				</div>

				{/* Assigned To */}
				<div>
					<label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
						Assigned to
					</label>
					<input
						type="text"
						defaultValue={item.assignedTo ?? ''}
						placeholder="Enter name..."
						className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
						onBlur={(e) => {
							const val = e.target.value.trim()
							const newVal = val === '' ? null : val
							if (newVal !== item.assignedTo) {
								updateItem.mutate({ id: item.id, assignedTo: newVal })
							}
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
						}}
					/>
				</div>

				{/* Delete - D-13 */}
				<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
					<DeleteButton
						onDelete={() => {
							deleteItem.mutate(item.id, { onSuccess: onClose })
						}}
						isPending={deleteItem.isPending}
					/>
				</div>
			</div>
		</Modal>
	)
}
