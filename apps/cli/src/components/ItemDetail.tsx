import React from 'react'
import { Box, Text } from 'ink'
import type { ItemResponse } from '../types.js'

function dueDateColor(dueDate: string | null): 'red' | 'yellow' | undefined {
	if (!dueDate) return undefined
	const today = new Date()
	const todayStr = today.toISOString().slice(0, 10)
	const dueStr = dueDate.slice(0, 10)
	if (dueStr < todayStr) return 'red'
	if (dueStr === todayStr) return 'yellow'
	return undefined
}

export function ItemDetail({ item }: { item: ItemResponse }) {
	const color = dueDateColor(item.dueDate)
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>{item.title}</Text>
			<Text dimColor>ID: {item.id}</Text>
			<Text dimColor>Column: {item.columnId}</Text>
			<Text>Description: {item.description ?? '(none)'}</Text>
			<Text>Labels: {item.labels?.join(', ') ?? '(none)'}</Text>
			<Box>
				<Text>Due Date: </Text>
				{item.dueDate ? (
					<Text color={color}>{item.dueDate.slice(0, 10)}</Text>
				) : (
					<Text>(none)</Text>
				)}
			</Box>
			<Text dimColor>Created: {item.createdAt}</Text>
			<Text dimColor>Updated: {item.updatedAt}</Text>
		</Box>
	)
}
