import { createMiddleware } from 'hono/factory'
import { jwt } from 'hono/jwt'
import { env } from '../env'

const cookieAuth = jwt({ secret: env.JWT_SECRET, alg: 'HS256', cookie: 'access_token' })
const bearerAuth = jwt({ secret: env.JWT_SECRET, alg: 'HS256' })

export const authMiddleware = createMiddleware(async (c, next) => {
	const authHeader = c.req.header('Authorization')
	if (authHeader?.startsWith('Bearer ')) {
		return bearerAuth(c, next)
	}
	return cookieAuth(c, next)
})
