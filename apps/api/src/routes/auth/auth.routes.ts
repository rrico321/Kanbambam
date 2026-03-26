import { createRoute, z } from '@hono/zod-openapi'
import { CreateUserSchema, LoginSchema, AuthTokensSchema } from '@kanbambam/shared'
import { envelopeSchema, ErrorResponseSchema } from '@kanbambam/shared'

export const signupRoute = createRoute({
	method: 'post',
	path: '/api/v1/auth/signup',
	tags: ['Auth'],
	summary: 'Create a new user account',
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateUserSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: envelopeSchema(AuthTokensSchema),
				},
			},
			description: 'User created successfully',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Invalid input',
		},
		409: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Email already registered',
		},
	},
})

export const loginRoute = createRoute({
	method: 'post',
	path: '/api/v1/auth/login',
	tags: ['Auth'],
	summary: 'Login with email and password',
	request: {
		body: {
			content: {
				'application/json': {
					schema: LoginSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(AuthTokensSchema),
				},
			},
			description: 'Login successful',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Invalid credentials',
		},
	},
})

export const refreshRoute = createRoute({
	method: 'post',
	path: '/api/v1/auth/refresh',
	tags: ['Auth'],
	summary: 'Refresh access token',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						refreshToken: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(AuthTokensSchema),
				},
			},
			description: 'Tokens refreshed',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Invalid or expired refresh token',
		},
	},
})
