import { Command } from 'commander'
import { printBanner } from './lib/banner.js'

const VERSION = '1.0.4'

const program = new Command()

// Handle -V/--version manually so we can show the banner
if (process.argv.includes('-V') || process.argv.includes('--version')) {
	printBanner(VERSION)
	process.exit(0)
}

program
	.name('kanbambam')
	.description('CLI-first Kanban board management')
	.action(() => {
		// Bare "kanbambam" with no command
		if (!program.opts().json) {
			printBanner(VERSION)
		}
		program.outputHelp()
	})

program.option('--json', 'Output raw JSON (matches API envelope format)')

const auth = program.command('auth').description('Authentication commands')

auth
	.command('login')
	.description('Log in via browser')
	.option('--manual', 'Manual token entry (for headless environments)')
	.action(async (options) => {
		if (!program.opts().json) {
			printBanner(VERSION)
		}
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

// Context commands
const context = program.command('context').description('Manage active workspace/board context')

context
	.command('set')
	.description('Set active workspace and/or board context')
	.option('-w, --workspace <id>', 'Workspace ID')
	.option('-b, --board <id>', 'Board ID')
	.action(async (options) => {
		const { contextSetCommand } = await import('./commands/context/set.js')
		await contextSetCommand(options, program.opts())
	})

context
	.command('clear')
	.description('Clear active context')
	.action(async () => {
		const { contextClearCommand } = await import('./commands/context/clear.js')
		await contextClearCommand(program.opts())
	})

// Default action for bare "kanbambam context" (per D-06)
context.action(async () => {
	const { contextShowCommand } = await import('./commands/context/show.js')
	await contextShowCommand(program.opts())
})

// Workspace commands
const workspace = program.command('workspace').description('Manage workspaces')

workspace
	.command('create')
	.description('Create a new workspace')
	.argument('<name>', 'Workspace name')
	.action(async (name: string) => {
		const { workspaceCreateCommand } = await import('./commands/workspace/create.js')
		await workspaceCreateCommand(name, program.opts())
	})

workspace
	.command('list')
	.description('List all workspaces')
	.action(async () => {
		const { workspaceListCommand } = await import('./commands/workspace/list.js')
		await workspaceListCommand(program.opts())
	})

workspace
	.command('rename')
	.description('Rename a workspace')
	.argument('<id>', 'Workspace ID')
	.option('-n, --name <name>', 'New name')
	.action(async (id: string, options: { name?: string }) => {
		const { workspaceRenameCommand } = await import('./commands/workspace/rename.js')
		await workspaceRenameCommand(id, options, program.opts())
	})

workspace
	.command('delete')
	.description('Delete a workspace')
	.argument('<id>', 'Workspace ID')
	.option('-f, --force', 'Skip confirmation prompt')
	.action(async (id: string, options: { force?: boolean }) => {
		const { workspaceDeleteCommand } = await import('./commands/workspace/delete.js')
		await workspaceDeleteCommand(id, options, program.opts())
	})

// Board commands
const board = program.command('board').description('Manage boards')

board
	.command('create')
	.description('Create a new board')
	.argument('<name>', 'Board name')
	.option('-w, --workspace <id>', 'Workspace ID (or use context)')
	.action(async (name: string, options: { workspace?: string }) => {
		const { boardCreateCommand } = await import('./commands/board/create.js')
		await boardCreateCommand(name, options, program.opts())
	})

board
	.command('list')
	.description('List boards in a workspace')
	.option('-w, --workspace <id>', 'Workspace ID (or use context)')
	.action(async (options: { workspace?: string }) => {
		const { boardListCommand } = await import('./commands/board/list.js')
		await boardListCommand(options, program.opts())
	})

board
	.command('rename')
	.description('Rename a board')
	.argument('<id>', 'Board ID')
	.option('-n, --name <name>', 'New name')
	.action(async (id: string, options: { name?: string }) => {
		const { boardRenameCommand } = await import('./commands/board/rename.js')
		await boardRenameCommand(id, options, program.opts())
	})

board
	.command('delete')
	.description('Delete a board')
	.argument('<id>', 'Board ID')
	.option('-f, --force', 'Skip confirmation prompt')
	.action(async (id: string, options: { force?: boolean }) => {
		const { boardDeleteCommand } = await import('./commands/board/delete.js')
		await boardDeleteCommand(id, options, program.opts())
	})

board
	.command('view')
	.description('View board as Kanban layout')
	.option('-b, --board <id>', 'Board ID (or use context)')
	.action(async (options: { board?: string }) => {
		const { boardViewCommand } = await import('./commands/board/view.js')
		await boardViewCommand(options, program.opts())
	})

// Column commands
const column = program.command('column').description('Manage columns')

column
	.command('add')
	.description('Add a column to a board')
	.argument('<name>', 'Column name')
	.option('-b, --board <id>', 'Board ID (or use context)')
	.action(async (name: string, options: { board?: string }) => {
const { columnAddCommand } = await import('./commands/column/add.js')
		await columnAddCommand(name, options, program.opts())
	})

column
	.command('rename')
	.description('Rename a column')
	.argument('<id>', 'Column ID')
	.option('-n, --name <name>', 'New name')
	.action(async (id: string, options: { name?: string }) => {
const { columnRenameCommand } = await import('./commands/column/rename.js')
		await columnRenameCommand(id, options, program.opts())
	})

column
	.command('reorder')
	.description('Reorder a column')
	.argument('<id>', 'Column ID')
	.requiredOption('-p, --position <n>', 'New position (1-based)')
	.action(async (id: string, options: { position: string }) => {
const { columnReorderCommand } = await import('./commands/column/reorder.js')
		await columnReorderCommand(id, options, program.opts())
	})

column
	.command('delete')
	.description('Delete a column')
	.argument('<id>', 'Column ID')
	.option('-f, --force', 'Skip confirmation and delete items')
	.option('--move-to <id>', 'Move items to this column before deleting')
	.action(async (id: string, options: { force?: boolean; moveTo?: string }) => {
const { columnDeleteCommand } = await import('./commands/column/delete.js')
		await columnDeleteCommand(id, options, program.opts())
	})

// Item commands
function collect(value: string, previous: string[]) {
	return previous.concat([value])
}

const item = program.command('item').description('Manage items')

item
	.command('create')
	.description('Create a new item')
	.argument('<title>', 'Item title')
	.option('-c, --column <id>', 'Column ID (required)')
	.option('-d, --description <text>', 'Item description')
	.action(async (title: string, options: { column?: string; description?: string }) => {
		const { itemCreateCommand } = await import('./commands/item/create.js')
		await itemCreateCommand(title, options, program.opts())
	})

item
	.command('list')
	.description('List items in a column')
	.option('-c, --column <id>', 'Column ID (required)')
	.action(async (options: { column?: string }) => {
		const { itemListCommand } = await import('./commands/item/list.js')
		await itemListCommand(options, program.opts())
	})

item
	.command('show')
	.description('Show item details')
	.argument('<id>', 'Item ID')
	.action(async (id: string) => {
		const { itemShowCommand } = await import('./commands/item/show.js')
		await itemShowCommand(id, program.opts())
	})

item
	.command('edit')
	.description('Edit an item')
	.argument('<id>', 'Item ID')
	.option('-t, --title <title>', 'New title')
	.option('-d, --description <text>', 'Description (empty string to clear)')
	.option('-l, --label <tag>', 'Label (repeatable, replaces all)', collect, [])
	.option('--due-date <date>', 'Due date YYYY-MM-DD (empty string to clear)')
	.action(async (id: string, options: { title?: string; description?: string; label?: string[]; dueDate?: string }) => {
		const { itemEditCommand } = await import('./commands/item/edit.js')
		await itemEditCommand(id, options, program.opts())
	})

item
	.command('move')
	.description('Move item to another column')
	.argument('<id>', 'Item ID')
	.requiredOption('--to <id>', 'Target column ID')
	.action(async (id: string, options: { to: string }) => {
		const { itemMoveCommand } = await import('./commands/item/move.js')
		await itemMoveCommand(id, options, program.opts())
	})

item
	.command('reorder')
	.description('Reorder item within its column')
	.argument('<id>', 'Item ID')
	.requiredOption('-p, --position <n>', 'New position (1-based)')
	.action(async (id: string, options: { position: string }) => {
		const { itemReorderCommand } = await import('./commands/item/reorder.js')
		await itemReorderCommand(id, options, program.opts())
	})

item
	.command('delete')
	.description('Delete an item')
	.argument('<id>', 'Item ID')
	.option('-f, --force', 'Skip confirmation prompt')
	.action(async (id: string, options: { force?: boolean }) => {
		const { itemDeleteCommand } = await import('./commands/item/delete.js')
		await itemDeleteCommand(id, options, program.opts())
	})

program.parse()
