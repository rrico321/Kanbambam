'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Workspace, Board, Column, Item } from '@kanbambam/shared'
import { toast } from 'sonner'

// ---- Workspaces ----
export function useWorkspaces() {
	return useQuery({
		queryKey: ['workspaces'],
		queryFn: async () => {
			const res = await api.get<Workspace[]>('/api/v1/workspaces')
			if (res.error) throw new Error(res.error.message)
			return res.data!
		},
	})
}

export function useCreateWorkspace() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (name: string) => api.post<Workspace>('/api/v1/workspaces', { name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['workspaces'] })
			toast.success('Workspace created')
		},
		onError: () => toast.error('Failed to create workspace'),
	})
}

export function useRenameWorkspace() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			api.patch<Workspace>(`/api/v1/workspaces/${id}`, { name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['workspaces'] })
		},
		onError: () => toast.error('Failed to rename workspace'),
	})
}

export function useDeleteWorkspace() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`/api/v1/workspaces/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['workspaces'] })
			toast.success('Workspace deleted')
		},
		onError: () => toast.error('Failed to delete workspace'),
	})
}

// ---- Boards ----
export function useBoards(workspaceId: string | undefined) {
	return useQuery({
		queryKey: ['workspaces', workspaceId, 'boards'],
		queryFn: async () => {
			const res = await api.get<Board[]>(`/api/v1/workspaces/${workspaceId}/boards`)
			if (res.error) throw new Error(res.error.message)
			return res.data!
		},
		enabled: !!workspaceId,
	})
}

export function useCreateBoard() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
			api.post<Board>(`/api/v1/workspaces/${workspaceId}/boards`, { name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['workspaces'] })
			toast.success('Board created')
		},
		onError: () => toast.error('Failed to create board'),
	})
}

export function useRenameBoard() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			api.patch<Board>(`/api/v1/boards/${id}`, { name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['workspaces'] })
		},
		onError: () => toast.error('Failed to rename board'),
	})
}

export function useDeleteBoard() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`/api/v1/boards/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['workspaces'] })
			toast.success('Board deleted')
		},
		onError: () => toast.error('Failed to delete board'),
	})
}

// ---- Columns (D-17: full CRUD in web) ----
export function useColumns(boardId: string | undefined) {
	return useQuery({
		queryKey: ['boards', boardId, 'columns'],
		queryFn: async () => {
			const res = await api.get<Column[]>(`/api/v1/boards/${boardId}/columns`)
			if (res.error) throw new Error(res.error.message)
			return res.data!
		},
		enabled: !!boardId,
	})
}

export function useCreateColumn() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
			api.post<Column>(`/api/v1/boards/${boardId}/columns`, { name }),
		onSuccess: (_d, vars) => {
			qc.invalidateQueries({ queryKey: ['boards', vars.boardId, 'columns'] })
			toast.success('Column created')
		},
		onError: () => toast.error('Failed to create column'),
	})
}

export function useRenameColumn() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			api.patch<Column>(`/api/v1/columns/${id}`, { name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boards'] })
			toast.success('Column renamed')
		},
		onError: () => toast.error('Failed to rename column'),
	})
}

export function useDeleteColumn() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`/api/v1/columns/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boards'] })
			toast.success('Column deleted')
		},
		onError: () => toast.error('Failed to delete column'),
	})
}

// ---- Items ----
export function useItems(columnId: string | undefined) {
	return useQuery({
		queryKey: ['columns', columnId, 'items'],
		queryFn: async () => {
			const res = await api.get<Item[]>(`/api/v1/columns/${columnId}/items`)
			if (res.error) throw new Error(res.error.message)
			return res.data!
		},
		enabled: !!columnId,
	})
}

export function useCreateItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
			api.post<Item>(`/api/v1/columns/${columnId}/items`, { title }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boards'] })
			toast.success('Item created')
		},
		onError: () => toast.error('Failed to create item'),
	})
}

export function useUpdateItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			...body
		}: {
			id: string
			title?: string
			description?: string | null
			dueDate?: string | null
			labels?: string[] | null
			assignedTo?: string | null
		}) => api.patch<Item>(`/api/v1/items/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boards'] })
			qc.invalidateQueries({ queryKey: ['boards'] })
		},
		onError: () => toast.error('Failed to update item'),
	})
}

export function useDeleteItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`/api/v1/items/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boards'] })
			toast.success('Item deleted')
		},
		onError: () => toast.error('Failed to delete item'),
	})
}

export function useMoveItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			itemId,
			columnId,
			position,
		}: { itemId: string; columnId: string; position: string }) =>
			api.post(`/api/v1/items/${itemId}/move`, { columnId, position }),
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ['boards'] })
			qc.invalidateQueries({ queryKey: ['boards'] })
		},
		onError: () =>
			toast.error('Failed to move item. It has been returned to its original position.'),
	})
}
