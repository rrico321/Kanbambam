import { Command } from 'commander'

const program = new Command()

program.name('kanbambam').description('CLI-first Kanban board management').version('0.0.1')

program.option('--json', 'Output raw JSON (matches API envelope format)')

const auth = program.command('auth').description('Authentication commands')

auth
	.command('login')
	.description('Log in via browser')
	.option('--manual', 'Manual token entry (for headless environments)')
	.action(async (options) => {
		const { loginCommand } = await import('./commands/auth/login.js')
		await loginCommand(options, program.opts())
	})

auth
	.command('logout')
	.description('Log out and revoke session')
	.action(async () => {
		const { logoutCommand } = await import('./commands/auth/logout.js')
		await logoutCommand(program.opts())
	})

auth
	.command('status')
	.description('Show current authentication status')
	.action(async () => {
		const { statusCommand } = await import('./commands/auth/status.js')
		await statusCommand(program.opts())
	})

program.parse()
