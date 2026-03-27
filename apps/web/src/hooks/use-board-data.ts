'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Column, Item } from '@kanbambam/shared'

const EMPTY_COLUMNS: Column[] = []
const EMPTY_ITEMS: Record<string, Item[]> = {}

export interface BoardData {
	columns: Column[]
	itemsByColumn: Record<string, Item[]>
	isLoading: boolean
	error: Error | null
}

export function useBoardData(boardId: string): BoardData {
	const columnsQuery = useQuery({
		queryKey: ['boards', boardId, 'columns'],
		queryFn: async () => {
			const res = await api.get<Column[]>(`/api/v1/boards/${boardId}/columns`)
			if (res.error) throw new Error(res.error.message)
			return res.data!
		},
	})

	const columns = columnsQuery.data ?? EMPTY_COLUMNS
	const sortedColumns = useMemo(
		() => [...columns].sort((a, b) => (a.position < b.position ? -1 : 1)),
		[columns],
	)

	const itemsQuery = useQuery({
		queryKey: ['boards', boardId, 'items', sortedColumns.map((c) => c.id).join(',')],
		queryFn: async () => {
			const entries = await Promise.all(
				sortedColumns.map(async (col) => {
					const res = await api.get<Item[]>(`/api/v1/columns/${col.id}/items`)
					const items = res.data ?? []
					const sorted = [...items].sort((a, b) => (a.position < b.position ? -1 : 1))
					return [col.id, sorted] as const
				}),
			)
			return Object.fromEntries(entries) as Record<string, Item[]>
		},
		enabled: sortedColumns.length > 0,
	})

	return {
		columns: sortedColumns,
		itemsByColumn: itemsQuery.data ?? EMPTY_ITEMS,
		isLoading: columnsQuery.isLoading || itemsQuery.isLoading,
		error: columnsQuery.error || itemsQuery.error,
	}
}
