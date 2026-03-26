import React from 'react'
import { Box, Text } from 'ink'

export function EmptyState({ message, command }: { message: string; command: string }) {
	return (
		<Box padding={1}>
			<Text dimColor>{message} Run </Text>
			<Text color="cyan">{command}</Text>
			<Text dimColor> to create one.</Text>
		</Box>
	)
}
