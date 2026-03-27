import * as readline from 'node:readline/promises'

export async function confirm(message: string): Promise<boolean> {
	if (!process.stdin.isTTY) {
		console.error('Aborted (no interactive terminal). Use --force to skip confirmation.')
		return false
	}
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
	try {
		const answer = await rl.question(`${message} [y/N] `)
		return answer.toLowerCase() === 'y'
	} finally {
		rl.close()
	}
}
