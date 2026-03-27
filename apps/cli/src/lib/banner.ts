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

export function printBanner(version?: string): void {
	const lines = BANNER.split('\n').filter((l) => l.length > 0)
	for (let i = 0; i < lines.length; i++) {
		const color = COLORS[i % COLORS.length]
		console.log(chalk.hex(color)(lines[i]))
	}
	const tagline = version
		? `  ${chalk.dim(`v${version}`)}  ${chalk.white('CLI-first Kanban board management')}`
		: `  ${chalk.white('CLI-first Kanban board management')}`
	console.log(tagline)
	console.log()
}
