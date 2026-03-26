import { z } from 'zod'
import { TimestampFields } from './common'

export const ColumnSchema = z.object({
	id: z.string().startsWith('col_'),
	name: z.string().min(1).max(100),
	position: z.string(),
	boardId: z.string().startsWith('brd_'),
	...TimestampFields,
})

export const CreateColumnSchema = z.object({
	name: z.string().min(1).max(100),
})

export const UpdateColumnSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	position: z.string().optional(),
})
