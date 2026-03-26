import { OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import { db } from '../../db'
import { refreshTokens, users } from '../../db/schema'
import { generateId } from '../../lib/id'
import { createAccessToken, generateRefreshToken, hashToken } from '../../lib/tokens'
import { env } from '../../env'
import { loginRoute, logoutRoute, refreshRoute, signupRoute } from './auth.routes'

function parseExpiry(expiry: string): Date {
	const match = expiry.match(/^(\d+)([mhd])$/)
	if (!match) throw new Error(`Invalid expiry format: ${expiry}`)
	const [, value, unit] = match
	const ms = {
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
	}[unit as 'm' | 'h' | 'd']
	return new Date(Date.now() + Number(value) * ms!)
}

async function createTokenPair(userId: string) {
	const accessToken = await createAccessToken(userId)
	const rawRefresh = generateRefreshToken()
	const tokenId = generateId('refreshToken')
	const tokenHash = hashToken(rawRefresh)
	const expiresAt = parseExpiry(env.REFRESH_TOKEN_EXPIRY)

	await db.insert(refreshTokens).values({
		id: tokenId,
		userId,
		tokenHash,
		expiresAt,
	})

	return { accessToken, refreshToken: rawRefresh }
}

export const authApp = new OpenAPIHono()

authApp.openapi(signupRoute, async (c) => {
	const { email, password } = c.req.valid('json')

	// Check for duplicate email
	const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
	if (existing.length > 0) {
		return c.json(
			{
				error: {
					code: 'DUPLICATE_EMAIL',
					message: 'Email already registered',
					details: {},
				},
			},
			409,
		)
	}

	const passwordHash = await argon2.hash(password)
	const userId = generateId('user')

	await db.insert(users).values({
		id: userId,
		email,
		passwordHash,
	})

	const tokens = await createTokenPair(userId)

	return c.json(
		{
			data: tokens,
			meta: { requestId: c.get('requestId') || '' },
		},
		201,
	)
})

authApp.openapi(loginRoute, async (c) => {
	const { email, password } = c.req.valid('json')

	const result = await db.select().from(users).where(eq(users.email, email))
	if (result.length === 0) {
		return c.json(
			{
				error: {
					code: 'INVALID_CREDENTIALS',
					message: 'Invalid email or password',
					details: {},
				},
			},
			401,
		)
	}

	const user = result[0]
	const valid = await argon2.verify(user.passwordHash, password)
	if (!valid) {
		return c.json(
			{
				error: {
					code: 'INVALID_CREDENTIALS',
					message: 'Invalid email or password',
					details: {},
				},
			},
			401,
		)
	}

	const tokens = await createTokenPair(user.id)

	return c.json(
		{
			data: tokens,
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

authApp.openapi(logoutRoute, async (c) => {
	const { refreshToken } = c.req.valid('json')
	const tokenHash = hashToken(refreshToken)

	const result = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.tokenHash, tokenHash))

	if (result.length === 0) {
		return c.json(
			{
				error: {
					code: 'INVALID_REFRESH_TOKEN',
					message: 'Invalid or expired refresh token',
					details: {},
				},
			},
			401,
		)
	}

	await db.delete(refreshTokens).where(eq(refreshTokens.id, result[0].id))

	return c.json(
		{
			data: { message: 'Logged out successfully' },
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})

authApp.openapi(refreshRoute, async (c) => {
	const { refreshToken } = c.req.valid('json')
	const tokenHash = hashToken(refreshToken)

	const result = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.tokenHash, tokenHash))

	if (result.length === 0 || result[0].expiresAt < new Date()) {
		// Clean up expired token if found
		if (result.length > 0) {
			await db.delete(refreshTokens).where(eq(refreshTokens.id, result[0].id))
		}
		return c.json(
			{
				error: {
					code: 'INVALID_REFRESH_TOKEN',
					message: 'Invalid or expired refresh token',
					details: {},
				},
			},
			401,
		)
	}

	const tokenRecord = result[0]

	// Delete used token (rotation)
	await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id))

	// Verify user still exists
	const userResult = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.id, tokenRecord.userId))
	if (userResult.length === 0) {
		return c.json(
			{
				error: {
					code: 'INVALID_REFRESH_TOKEN',
					message: 'Invalid or expired refresh token',
					details: {},
				},
			},
			401,
		)
	}

	const tokens = await createTokenPair(tokenRecord.userId)

	return c.json(
		{
			data: tokens,
			meta: { requestId: c.get('requestId') || '' },
		},
		200,
	)
})
