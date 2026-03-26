import { z } from 'zod'

// Response envelope per D-04
export const MetaSchema = z.object({
	requestId: z.string(),
})

export const PaginationMetaSchema = z.object({
	total: z.number().int().nonnegative(),
	cursor: z.string().nullable(),
})

// Error response per D-05
export const ErrorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.record(z.unknown()).optional(),
	}),
})

// Pagination query params per D-10
export const PaginationQuerySchema = z.object({
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Helper to wrap data in envelope
export function envelopeSchema<T extends z.ZodType>(dataSchema: T) {
	return z.object({
		data: dataSchema,
		meta: MetaSchema,
	})
}

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
	return z.object({
		data: z.array(itemSchema),
		meta: PaginationMetaSchema,
	})
}

// Shared field schemas
export const TimestampFields = {
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
}
