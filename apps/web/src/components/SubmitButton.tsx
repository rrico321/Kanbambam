'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton({
	children,
	loadingText,
}: { children: React.ReactNode; loadingText: string }) {
	const { pending } = useFormStatus()
	return (
		<button
			type="submit"
			disabled={pending}
			className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{pending ? loadingText : children}
		</button>
	)
}
