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
		// @ts-expect-error -- implemented in Plan 02
		const { workspaceCreateCommand } = await import('./commands/workspace/create.js')
		await workspaceCreateCommand(name, program.opts())
	})

workspace
	.command('list')
	.description('List all workspaces')
	.action(async () => {
		// @ts-expect-error -- implemented in Plan 02
		const { workspaceListCommand } = await import('./commands/workspace/list.js')
		await workspaceListCommand(program.opts())
	})

workspace
	.command('rename')
	.description('Rename a workspace')
	.argument('<id>', 'Workspace ID')
	.option('-n, --name <name>', 'New name')
	.action(async (id: string, options: { name?: string }) => {
		// @ts-expect-error -- implemented in Plan 02
		const { workspaceRenameCommand } = await import('./commands/workspace/rename.js')
		await workspaceRenameCommand(id, options, program.opts())
	})

workspace
	.command('delete')
	.description('Delete a workspace')
	.argument('<id>', 'Workspace ID')
	.option('-f, --force', 'Skip confirmation prompt')
	.action(async (id: string, options: { force?: boolean }) => {
		// @ts-expect-error -- implemented in Plan 02
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

// Column commands
const column = program.command('column').description('Manage columns')

column
	.command('add')
	.description('Add a column to a board')
	.argument('<name>', 'Column name')
	.option('-b, --board <id>', 'Board ID (or use context)')
	.action(async (name: string, options: { board?: string }) => {
		// @ts-expect-error -- implemented in Plan 04
		const { columnAddCommand } = await import('./commands/column/add.js')
		await columnAddCommand(name, options, program.opts())
	})

column
	.command('rename')
	.description('Rename a column')
	.argument('<id>', 'Column ID')
	.option('-n, --name <name>', 'New name')
	.action(async (id: string, options: { name?: string }) => {
		// @ts-expect-error -- implemented in Plan 04
		const { columnRenameCommand } = await import('./commands/column/rename.js')
		await columnRenameCommand(id, options, program.opts())
	})

column
	.command('reorder')
	.description('Reorder a column')
	.argument('<id>', 'Column ID')
	.requiredOption('-p, --position <n>', 'New position (1-based)')
	.action(async (id: string, options: { position: string }) => {
		// @ts-expect-error -- implemented in Plan 04
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
		// @ts-expect-error -- implemented in Plan 04
		const { columnDeleteCommand } = await import('./commands/column/delete.js')
		await columnDeleteCommand(id, options, program.opts())
	})

program.parse()
