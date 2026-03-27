export function BoardSkeleton() {
	return (
		<div className="flex gap-4 px-6 py-4">
			{[1, 2, 3].map((i) => (
				<div key={i} className="w-[280px] flex-shrink-0">
					<div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
					{[1, 2, 3].map((j) => (
						<div
							key={j}
							className="h-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-2"
						/>
					))}
				</div>
			))}
		</div>
	)
}

export function SidebarSkeleton() {
	return (
		<div className="px-4 py-3 space-y-4">
			{[1, 2, 3].map((i) => (
				<div key={i} className="space-y-2">
					<div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
					<div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse ml-4" />
					<div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse ml-4" />
				</div>
			))}
		</div>
	)
}
