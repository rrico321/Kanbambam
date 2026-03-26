import * as readline from 'node:readline/promises'

export async function confirm(message: string): Promise<boolean> {
	if (!process.stdin.isTTY) return false
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
	try {
		const answer = await rl.question(`${message} [y/N] `)
		return answer.toLowerCase() === 'y'
	} finally {
		rl.close()
	}
}
