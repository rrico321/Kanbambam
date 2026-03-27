interface EmptyStateProps {
	heading: string
	body: string
	action?: React.ReactNode
}

export function EmptyState({ heading, body, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{heading}</h3>
			<p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{body}</p>
			{action && <div className="mt-4">{action}</div>}
		</div>
	)
}
