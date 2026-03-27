import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/error-handler'
import { authApp } from './routes/auth/auth.handlers'
import { workspacesApp } from './routes/workspaces/workspaces.handlers'
import { boardsApp } from './routes/boards/boards.handlers'
import { columnsApp } from './routes/columns/columns.handlers'
import { itemsApp } from './routes/items/items.handlers'

const app = new OpenAPIHono()

// Global middleware
app.use('*', cors({
	origin: (origin) => {
		const allowed = [
			process.env.WEB_URL || 'http://localhost:3001',
			'http://localhost:3001',
		]
		return allowed.includes(origin) ? origin : null
	},
	credentials: true,
}))
app.use('*', requestId())
app.onError(errorHandler)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Auth middleware on protected routes
app.use('/api/v1/workspaces/*', authMiddleware)
app.use('/api/v1/boards/*', authMiddleware)
app.use('/api/v1/columns/*', authMiddleware)
app.use('/api/v1/items/*', authMiddleware)

// Auth routes (no auth middleware)
app.route('', authApp)

// Entity routes
app.route('', workspacesApp)
app.route('', boardsApp)
app.route('', columnsApp)
app.route('', itemsApp)

// OpenAPI doc endpoint
app.doc('/api/docs', {
	openapi: '3.0.0',
	info: { title: 'Kanbambam API', version: '0.1.0' },
})

export { app }
