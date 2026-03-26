import React from 'react'
import { Box, Text } from 'ink'

interface TableColumn {
	key: string
	label: string
	width?: number
}

interface TableProps {
	columns: TableColumn[]
	rows: Record<string, string>[]
}

export function Table({ columns, rows }: TableProps) {
	return (
		<Box flexDirection="column" borderStyle="round" paddingX={1}>
			<Box>
				{columns.map((col) => (
					<Box key={col.key} width={col.width ?? 20}>
						<Text bold>{col.label}</Text>
					</Box>
				))}
			</Box>
			<Box>
				<Text dimColor>
					{columns.map((col) => '-'.repeat((col.width ?? 20) - 1)).join(' ')}
				</Text>
			</Box>
			{rows.map((row, i) => (
				<Box key={i}>
					{columns.map((col) => (
						<Box key={col.key} width={col.width ?? 20}>
							<Text>{row[col.key] ?? ''}</Text>
						</Box>
					))}
				</Box>
			))}
		</Box>
	)
}
