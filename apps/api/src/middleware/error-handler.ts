import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler: ErrorHandler = (err, c) => {
	if (err instanceof HTTPException) {
		const status = err.status
		return c.json(
			{
				error: {
					code: err.message.toUpperCase().replace(/\s+/g, '_'),
					message: err.message,
					details: {},
				},
			},
			status,
		)
	}

	console.error('Unhandled error:', err)
	return c.json(
		{
			error: {
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred',
				details: {},
			},
		},
		500,
	)
}
