import React from 'react'
import { Box, Text } from 'ink'
import type { ContextEntry } from '../lib/config.js'

export function ContextDisplay({
	workspace,
	board,
}: { workspace: ContextEntry | null; board: ContextEntry | null }) {
	return (
		<Box flexDirection="column" padding={1}>
			<Box>
				<Text bold>Workspace: </Text>
				{workspace ? (
					<>
						<Text>{workspace.name}</Text>
						<Text dimColor> ({workspace.id})</Text>
					</>
				) : (
					<Text dimColor>(not set)</Text>
				)}
			</Box>
			<Box>
				<Text bold>{'Board:     '}</Text>
				{board ? (
					<>
						<Text>{board.name}</Text>
						<Text dimColor> ({board.id})</Text>
					</>
				) : (
					<Text dimColor>(not set)</Text>
				)}
			</Box>
		</Box>
	)
}
