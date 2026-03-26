import React from 'react'
import { Box, Text } from 'ink'

interface BoardColumn {
	id: string
	name: string
	items: { id: string; title: string; dueDate: string | null; labels: string[] | null }[]
}

function dueDateColor(dueDate: string | null): string | undefined {
	if (!dueDate) return undefined
	const due = new Date(dueDate)
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
	if (dueDay < today) return 'red'
	if (dueDay.getTime() === today.getTime()) return 'yellow'
	return undefined
}

export function BoardView({ columns, width }: { columns: BoardColumn[]; width: number }) {
	const colWidth = Math.max(20, Math.floor(width / Math.max(columns.length, 1)) - 2)

	return (
		<Box>
			{columns.map((col) => (
				<Box key={col.id} flexDirection="column" width={colWidth} borderStyle="round" paddingX={1}>
					<Text bold>{col.name} ({col.items.length})</Text>
					<Text dimColor>{'-'.repeat(Math.max(colWidth - 4, 1))}</Text>
					{col.items.map((item) => (
						<Box key={item.id} flexDirection="column">
							<Text wrap="truncate">{item.title}</Text>
							{item.labels && item.labels.length > 0 && (
								<Text dimColor wrap="truncate">  {item.labels.join(', ')}</Text>
							)}
							{item.dueDate && (
								<Text color={dueDateColor(item.dueDate)} wrap="truncate">  {item.dueDate.slice(0, 10)}</Text>
							)}
						</Box>
					))}
					{col.items.length === 0 && <Text dimColor>(empty)</Text>}
				</Box>
			))}
		</Box>
	)
}
