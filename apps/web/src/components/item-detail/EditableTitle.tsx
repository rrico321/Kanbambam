'use client'

import { useState, useRef, useEffect } from 'react'

interface EditableTitleProps {
	value: string
	onSave: (value: string) => void
}

export function EditableTitle({ value, onSave }: EditableTitleProps) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(value)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setDraft(value)
	}, [value])
	useEffect(() => {
		if (editing) inputRef.current?.focus()
	}, [editing])

	const handleSave = () => {
		setEditing(false)
		if (draft.trim() && draft.trim() !== value) onSave(draft.trim())
		else setDraft(value)
	}

	if (!editing) {
		return (
			<h2
				className="text-xl font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2"
				onClick={() => setEditing(true)}
			>
				{value}
			</h2>
		)
	}

	return (
		<input
			ref={inputRef}
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={handleSave}
			onKeyDown={(e) => {
				if (e.key === 'Enter') handleSave()
				if (e.key === 'Escape') {
					setDraft(value)
					setEditing(false)
				}
			}}
			className="text-xl font-semibold w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
		/>
	)
}
