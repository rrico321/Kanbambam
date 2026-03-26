import { z } from 'zod'
import { TimestampFields } from './common'

export const BoardSchema = z.object({
	id: z.string().startsWith('brd_'),
	name: z.string().min(1).max(100),
	workspaceId: z.string().startsWith('wks_'),
	...TimestampFields,
})

export const CreateBoardSchema = z.object({
	name: z.string().min(1).max(100),
})

export const UpdateBoardSchema = z.object({
	name: z.string().min(1).max(100),
})
