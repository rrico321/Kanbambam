import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock the API client
const mockGet = vi.fn()
vi.mock('@/lib/api', () => ({
	api: {
		get: (...args: unknown[]) => mockGet(...args),
	},
}))

import { useBoardData } from './use-board-data'

function createWrapper() {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={qc}>{children}</QueryClientProvider>
	)
}

describe('useBoardData', () => {
	beforeEach(() => {
		mockGet.mockReset()
	})

	it('fetches columns from API for the given boardId', async () => {
		mockGet.mockResolvedValueOnce({
			data: [
				{ id: 'col_1', name: 'Todo', position: 'a0', boardId: 'brd_1' },
				{ id: 'col_2', name: 'Done', position: 'a1', boardId: 'brd_1' },
			],
		})
		// Items queries for each column
		mockGet.mockResolvedValueOnce({ data: [] })
		mockGet.mockResolvedValueOnce({ data: [] })

		const { result } = renderHook(() => useBoardData('brd_1'), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isLoading).toBe(false))

		expect(mockGet).toHaveBeenCalledWith('/api/v1/boards/brd_1/columns')
		expect(result.current.columns).toHaveLength(2)
		expect(result.current.columns[0].name).toBe('Todo')
	})

	it('returns sorted columns by position', async () => {
		mockGet.mockResolvedValueOnce({
			data: [
				{ id: 'col_2', name: 'Done', position: 'b0', boardId: 'brd_1' },
				{ id: 'col_1', name: 'Todo', position: 'a0', boardId: 'brd_1' },
			],
		})
		mockGet.mockResolvedValueOnce({ data: [] })
		mockGet.mockResolvedValueOnce({ data: [] })

		const { result } = renderHook(() => useBoardData('brd_1'), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isLoading).toBe(false))

		expect(result.current.columns[0].name).toBe('Todo')
		expect(result.current.columns[1].name).toBe('Done')
	})
})
