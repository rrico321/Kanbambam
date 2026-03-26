import React from 'react'
import { Box, Text } from 'ink'

export function AuthSuccess({ email }: { email?: string }) {
	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
				<Text color="green" bold>
					Logged in{email ? ` as ${email}` : ' successfully'}
				</Text>
			</Box>
			<Box marginTop={1}>
				<Text dimColor>Run </Text>
				<Text color="cyan">kanbambam workspace list</Text>
				<Text dimColor> to get started</Text>
			</Box>
		</Box>
	)
}
