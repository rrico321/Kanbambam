import { z } from 'zod'
import { TimestampFields } from './common'

export const WorkspaceSchema = z.object({
	id: z.string().startsWith('wks_'),
	name: z.string().min(1).max(100),
	userId: z.string().startsWith('usr_'),
	...TimestampFields,
})

export const CreateWorkspaceSchema = z.object({
	name: z.string().min(1).max(100),
})

export const UpdateWorkspaceSchema = z.object({
	name: z.string().min(1).max(100),
})
