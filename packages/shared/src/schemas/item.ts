import { z } from 'zod'
import { TimestampFields } from './common'

export const ItemSchema = z.object({
	id: z.string().startsWith('itm_'),
	title: z.string().min(1).max(500),
	description: z.string().nullable(),
	position: z.string(),
	columnId: z.string().startsWith('col_'),
	dueDate: z.string().datetime().nullable(),
	labels: z.array(z.string()).nullable(),
	...TimestampFields,
})

export const CreateItemSchema = z.object({
	title: z.string().min(1).max(500),
	description: z.string().optional(),
})

export const UpdateItemSchema = z.object({
	title: z.string().min(1).max(500).optional(),
	description: z.string().nullable().optional(),
	dueDate: z.string().datetime().nullable().optional(),
	labels: z.array(z.string()).nullable().optional(),
})

export const MoveItemSchema = z.object({
	columnId: z.string().startsWith('col_'),
	position: z.string().optional(),
})
