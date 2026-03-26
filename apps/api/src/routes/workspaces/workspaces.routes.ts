import { createRoute, z } from '@hono/zod-openapi'
import {
	WorkspaceSchema,
	CreateWorkspaceSchema,
	UpdateWorkspaceSchema,
	PaginationQuerySchema,
	envelopeSchema,
	paginatedSchema,
	ErrorResponseSchema,
} from '@kanbambam/shared'

export const listWorkspacesRoute = createRoute({
	method: 'get',
	path: '/api/v1/workspaces',
	tags: ['Workspaces'],
	summary: 'List workspaces for the authenticated user',
	request: {
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: paginatedSchema(WorkspaceSchema),
				},
			},
			description: 'List of workspaces',
		},
	},
})

export const createWorkspaceRoute = createRoute({
	method: 'post',
	path: '/api/v1/workspaces',
	tags: ['Workspaces'],
	summary: 'Create a new workspace',
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateWorkspaceSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: envelopeSchema(WorkspaceSchema),
				},
			},
			description: 'Workspace created',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Invalid input',
		},
	},
})

export const getWorkspaceRoute = createRoute({
	method: 'get',
	path: '/api/v1/workspaces/{id}',
	tags: ['Workspaces'],
	summary: 'Get a single workspace',
	request: {
		params: z.object({
			id: z.string().startsWith('wks_'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(WorkspaceSchema),
				},
			},
			description: 'Workspace found',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Workspace not found',
		},
	},
})

export const updateWorkspaceRoute = createRoute({
	method: 'patch',
	path: '/api/v1/workspaces/{id}',
	tags: ['Workspaces'],
	summary: 'Update a workspace',
	request: {
		params: z.object({
			id: z.string().startsWith('wks_'),
		}),
		body: {
			content: {
				'application/json': {
					schema: UpdateWorkspaceSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: envelopeSchema(WorkspaceSchema),
				},
			},
			description: 'Workspace updated',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Workspace not found',
		},
	},
})

export const deleteWorkspaceRoute = createRoute({
	method: 'delete',
	path: '/api/v1/workspaces/{id}',
	tags: ['Workspaces'],
	summary: 'Delete a workspace',
	request: {
		params: z.object({
			id: z.string().startsWith('wks_'),
		}),
	},
	responses: {
		204: {
			description: 'Workspace deleted',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Workspace not found',
		},
	},
})
