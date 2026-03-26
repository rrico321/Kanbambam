import React from 'react'
import { Box, Text } from 'ink'

export function AuthStatus({
	authenticated,
	email,
}: { authenticated: boolean; email?: string }) {
	if (!authenticated) {
		return (
			<Box padding={1}>
				<Text dimColor>Not logged in. Run </Text>
				<Text color="cyan">kanbambam auth login</Text>
				<Text dimColor> to authenticate.</Text>
			</Box>
		)
	}
	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
				<Text color="green" bold>
					Logged in{email ? ` as ${email}` : ''}
				</Text>
			</Box>
		</Box>
	)
}
