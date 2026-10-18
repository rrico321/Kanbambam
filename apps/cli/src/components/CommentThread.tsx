import { Box, Text } from 'ink'

interface ThreadComment {
	id: string
	authorEmail: string
	body: string
	when: string
}

export function CommentThread({ comments }: { comments: ThreadComment[] }) {
	return (
		<Box flexDirection="column" paddingX={1}>
			{comments.map((c) => (
				<Box key={c.id} flexDirection="column" marginBottom={1}>
					<Text>
						<Text bold>{c.authorEmail}</Text>
						<Text dimColor>
							{' '}
							· {c.when} · {c.id}
						</Text>
					</Text>
					<Text>{c.body}</Text>
				</Box>
			))}
		</Box>
	)
}
