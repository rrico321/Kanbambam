'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { move } from '@dnd-kit/helpers'
import type { Column, Item } from '@kanbambam/shared'
import { useMoveItem } from './use-api'
import { calculatePosition } from '@/lib/positions'

export function useOptimisticMove(
	columns: Column[],
	itemsByColumn: Record<string, Item[]>,
) {
	const moveItem = useMoveItem()
	const [localItems, setLocalItems] = useState<Record<string, Item[]>>({})
	const isDragging = useRef(false)
	const preDropSnapshot = useRef<Record<string, Item[]>>({})

	// Sync from TanStack Query when not dragging
	useEffect(() => {
		if (!isDragging.current) {
			setLocalItems(itemsByColumn)
		}
	}, [itemsByColumn])

	// Current state: local during drag, TanStack Query otherwise
	const currentItems =
		Object.keys(localItems).length > 0 ? localItems : itemsByColumn

	const handleDragStart = useCallback(() => {
		isDragging.current = true
		preDropSnapshot.current = structuredClone(currentItems)
	}, [currentItems])

	const handleDragOver = useCallback(
		(event: Parameters<typeof move>[1]) => {
			setLocalItems((prev) => {
				// Build the data structure move() expects: Record<string, {id: string}[]>
				const data: Record<string, { id: string }[]> = {}
				for (const col of columns) {
					data[col.id] = (prev[col.id] ?? itemsByColumn[col.id] ?? []).map(
						(it) => ({ id: it.id }),
					)
				}
				const moved = move(data, event) as Record<string, { id: string }[]>

				// Map back to full Item objects
				// Build a lookup of all items by id for fast access
				const itemLookup = new Map<string, Item>()
				for (const items of Object.values(prev)) {
					for (const item of items) {
						itemLookup.set(item.id, item)
					}
				}
				// Fallback to server data
				if (itemLookup.size === 0) {
					for (const items of Object.values(itemsByColumn)) {
						for (const item of items) {
							itemLookup.set(item.id, item)
						}
					}
				}

				const result: Record<string, Item[]> = {}
				for (const colId of Object.keys(moved)) {
					result[colId] = moved[colId].map((stub) => {
						return itemLookup.get(stub.id) ?? (stub as unknown as Item)
					})
				}
				return result
			})
		},
		[columns, itemsByColumn],
	)

	const handleDragEnd = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(event: any) => {
			isDragging.current = false

			if (event.canceled) {
				setLocalItems(preDropSnapshot.current)
				return
			}

			const { source } = event.operation
			if (!source) return

			const itemId = String(source.id)

			// Find which column the item is now in and at what index
			let targetColumnId: string | null = null
			let targetIndex = -1

			for (const col of columns) {
				const colItems = localItems[col.id] ?? []
				const idx = colItems.findIndex((it) => it.id === itemId)
				if (idx !== -1) {
					targetColumnId = col.id
					targetIndex = idx
					break
				}
			}

			if (!targetColumnId || targetIndex === -1) return

			// Calculate fractional-index position
			const colItems = localItems[targetColumnId] ?? []
			const otherItems = colItems.filter((it) => it.id !== itemId)
			const position = calculatePosition(otherItems, targetIndex)

			// Fire API call
			moveItem.mutate(
				{ itemId, columnId: targetColumnId, position },
				{
					onError: () => {
						// Rollback to pre-drag state
						setLocalItems(preDropSnapshot.current)
					},
				},
			)
		},
		[columns, localItems, moveItem],
	)

	return {
		items: currentItems,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	}
}
