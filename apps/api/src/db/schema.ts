import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const refreshTokens = pgTable(
	'refresh_tokens',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('refresh_tokens_user_id_idx').on(t.userId)],
)

export const workspaces = pgTable(
	'workspaces',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('workspaces_user_id_idx').on(t.userId)],
)

export const boards = pgTable(
	'boards',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		workspaceId: text('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('boards_workspace_id_idx').on(t.workspaceId)],
)

export const columns = pgTable(
	'columns',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		position: text('position').notNull(),
		boardId: text('board_id')
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('columns_board_id_position_idx').on(t.boardId, t.position)],
)

export const items = pgTable(
	'items',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description'),
		position: text('position').notNull(),
		columnId: text('column_id')
			.notNull()
			.references(() => columns.id, { onDelete: 'cascade' }),
		dueDate: timestamp('due_date', { withTimezone: true }),
		labels: text('labels').array(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('items_column_id_position_idx').on(t.columnId, t.position)],
)
