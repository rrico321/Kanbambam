import React from 'react'
import { Text } from 'ink'

const FRAMES = ['|', '/', '-', '\\']

export function Spinner({ label }: { label: string }) {
	const [frame, setFrame] = React.useState(0)
	React.useEffect(() => {
		const timer = setInterval(() => {
			setFrame((prev) => (prev + 1) % FRAMES.length)
		}, 100)
		return () => clearInterval(timer)
	}, [])
	return (
		<Text>
			{FRAMES[frame]} {label}
		</Text>
	)
}
