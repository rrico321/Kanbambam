import type { z } from 'zod'
import type { BoardSchema, CreateBoardSchema, UpdateBoardSchema } from '../schemas/board'
import type { ColumnSchema, CreateColumnSchema, UpdateColumnSchema } from '../schemas/column'
import type {
	CreateItemSchema,
	ItemSchema,
	MoveItemSchema,
	UpdateItemSchema,
} from '../schemas/item'
import type { AuthTokensSchema, CreateUserSchema, LoginSchema, UserSchema } from '../schemas/user'
import type {
	CreateWorkspaceSchema,
	UpdateWorkspaceSchema,
	WorkspaceSchema,
} from '../schemas/workspace'

// Re-export inferred types
export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type Login = z.infer<typeof LoginSchema>
export type AuthTokens = z.infer<typeof AuthTokensSchema>

export type Workspace = z.infer<typeof WorkspaceSchema>
export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>
export type UpdateWorkspace = z.infer<typeof UpdateWorkspaceSchema>

export type Board = z.infer<typeof BoardSchema>
export type CreateBoard = z.infer<typeof CreateBoardSchema>
export type UpdateBoard = z.infer<typeof UpdateBoardSchema>

export type Column = z.infer<typeof ColumnSchema>
export type CreateColumn = z.infer<typeof CreateColumnSchema>
export type UpdateColumn = z.infer<typeof UpdateColumnSchema>

export type Item = z.infer<typeof ItemSchema>
export type CreateItem = z.infer<typeof CreateItemSchema>
export type UpdateItem = z.infer<typeof UpdateItemSchema>
export type MoveItem = z.infer<typeof MoveItemSchema>
