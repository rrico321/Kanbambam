import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/error-handler'

const app = new OpenAPIHono()

// Global middleware
app.use('*', cors())
app.use('*', requestId())
app.onError(errorHandler)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Auth middleware on protected routes
app.use('/api/v1/workspaces/*', authMiddleware)
app.use('/api/v1/boards/*', authMiddleware)
app.use('/api/v1/columns/*', authMiddleware)
app.use('/api/v1/items/*', authMiddleware)

// Route mounting will be added here by Task 3 and Plan 03/04

// OpenAPI doc endpoint
app.doc('/api/docs', {
	openapi: '3.0.0',
	info: { title: 'Kanbambam API', version: '0.1.0' },
})

export { app }
