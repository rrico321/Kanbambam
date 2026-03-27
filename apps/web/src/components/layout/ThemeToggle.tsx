'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
	const [dark, setDark] = useState(false)

	useEffect(() => {
		const isDark = document.documentElement.classList.contains('dark')
		setDark(isDark)
	}, [])

	function toggle() {
		const next = !dark
		setDark(next)
		document.documentElement.classList.toggle('dark', next)
		localStorage.setItem('kanbambam_theme', next ? 'dark' : 'light')
	}

	return (
		<button
			onClick={toggle}
			className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
		</button>
	)
}
