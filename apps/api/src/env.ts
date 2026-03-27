import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		JWT_SECRET: z.string().min(32),
		JWT_EXPIRY: z.string().default('15m'),
		REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	},
	runtimeEnv: process.env,
})
