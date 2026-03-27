'use client'

import { useState, useRef, useEffect } from 'react'

interface EditableDescriptionProps {
	value: string | null
	onSave: (value: string | null) => void
}

export function EditableDescription({ value, onSave }: EditableDescriptionProps) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(value ?? '')
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		setDraft(value ?? '')
	}, [value])
	useEffect(() => {
		if (editing) textareaRef.current?.focus()
	}, [editing])

	const handleSave = () => {
		setEditing(false)
		const trimmed = draft.trim()
		const newVal = trimmed || null
		if (newVal !== value) onSave(newVal)
	}

	if (!editing) {
		return (
			<div
				className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 min-h-[2rem]"
				onClick={() => setEditing(true)}
			>
				{value ? (
					<p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
						{value}
					</p>
				) : (
					<p className="text-sm text-gray-400 dark:text-gray-500 italic">
						Add a description...
					</p>
				)}
			</div>
		)
	}

	return (
		<textarea
			ref={textareaRef}
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={handleSave}
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					setDraft(value ?? '')
					setEditing(false)
				}
			}}
			rows={4}
			className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
			placeholder="Add a description..."
		/>
	)
}
