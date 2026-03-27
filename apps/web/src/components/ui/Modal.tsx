'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
	open: boolean
	onClose: () => void
	children: React.ReactNode
}

export function Modal({ open, onClose, children }: ModalProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		},
		[onClose],
	)

	useEffect(() => {
		if (open) {
			document.addEventListener('keydown', handleKeyDown)
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [open, handleKeyDown])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-6 p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					aria-label="Close modal"
				>
					<X className="w-6 h-6" />
				</button>
				{children}
			</div>
		</div>
	)
}
