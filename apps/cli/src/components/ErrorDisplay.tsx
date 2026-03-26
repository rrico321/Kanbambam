import React from 'react'
import { Box, Text } from 'ink'

export function ErrorDisplay({
	message,
	suggestion,
}: { message: string; suggestion?: string }) {
	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
				<Text color="red" bold>
					{message}
				</Text>
			</Box>
			{suggestion && (
				<Box marginTop={1}>
					<Text dimColor>{suggestion}</Text>
				</Box>
			)}
		</Box>
	)
}
