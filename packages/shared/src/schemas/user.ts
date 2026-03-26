import { z } from 'zod'
import { TimestampFields } from './common'

export const UserSchema = z.object({
	id: z.string().startsWith('usr_'),
	email: z.string().email(),
	...TimestampFields,
})

export const CreateUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).max(128),
})

export const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
})

export const AuthTokensSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
})
