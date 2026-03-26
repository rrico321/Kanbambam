import { createHash } from 'node:crypto'
import { SignJWT } from 'jose'
import { nanoid } from 'nanoid'
import { env } from '../env'

const secret = new TextEncoder().encode(env.JWT_SECRET)

export async function createAccessToken(userId: string): Promise<string> {
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(env.JWT_EXPIRY)
		.sign(secret)
}

export function generateRefreshToken(): string {
	return nanoid(32)
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex')
}
