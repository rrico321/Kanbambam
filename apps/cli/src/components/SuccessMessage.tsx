import React from 'react'
import { Box, Text } from 'ink'

export function SuccessMessage({ message }: { message: string }) {
	return (
		<Box padding={1}>
			<Text color="green" bold>
				{message}
			</Text>
		</Box>
	)
}
