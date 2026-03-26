import { config } from './config.js'

export function resolveWorkspaceId(flags: { workspace?: string }): string {
	if (flags.workspace) return flags.workspace
	const active = config.get('activeWorkspace')
	if (active?.id) return active.id
	throw new Error(
		'No workspace specified. Use --workspace <id> or set context with: kanbambam context set --workspace <id>',
	)
}

export function resolveBoardId(flags: { board?: string }): string {
	if (flags.board) return flags.board
	const active = config.get('activeBoard')
	if (active?.id) return active.id
	throw new Error(
		'No board specified. Use --board <id> or set context with: kanbambam context set --board <id>',
	)
}
