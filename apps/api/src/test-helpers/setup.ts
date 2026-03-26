import { SignJWT } from 'jose'

const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-testing'
const secret = new TextEncoder().encode(TEST_JWT_SECRET)

export async function createTestToken(userId: string = 'usr_test12345678'): Promise<string> {
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('1h')
		.sign(secret)
}

export { TEST_JWT_SECRET }
