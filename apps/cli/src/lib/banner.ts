import chalk from 'chalk'

const BANNER = `
 ██╗  ██╗ █████╗ ███╗   ██╗██████╗  █████╗ ███╗   ███╗██████╗  █████╗ ███╗   ███╗
 ██║ ██╔╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗████╗ ████║
 █████╔╝ ███████║██╔██╗ ██║██████╔╝███████║██╔████╔██║██████╔╝███████║██╔████╔██║
 ██╔═██╗ ██╔══██║██║╚██╗██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██╗██╔══██║██║╚██╔╝██║
 ██║  ██╗██║  ██║██║ ╚████║██████╔╝██║  ██║██║ ╚═╝ ██║██████╔╝██║  ██║██║ ╚═╝ ██║
 ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝`

const COLORS = [
	'#22d3ee', // cyan-400
	'#06b6d4', // cyan-500
	'#0891b2', // cyan-600
	'#0e7490', // cyan-700
	'#155e75', // cyan-800
	'#164e63', // cyan-900
]

export function printBanner(version?: string, returnString?: boolean): string {
	const lines = BANNER.split('\n').filter((l) => l.length > 0)
	const coloredLines = lines.map((line, i) => {
		const color = COLORS[i % COLORS.length]
		return chalk.hex(color)(line)
	})
	const tagline = version
		? `  ${chalk.dim(`v${version}`)}  ${chalk.white('CLI-first Kanban board management')}`
		: `  ${chalk.white('CLI-first Kanban board management')}`
	coloredLines.push(tagline)

	const output = coloredLines.join('\n')
	if (returnString) return output
	console.log(output)
	console.log()
	return output
}
