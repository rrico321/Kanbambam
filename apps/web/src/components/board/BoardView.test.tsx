import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock use-board-data to return test data
vi.mock('@/hooks/use-board-data', () => ({
	useBoardData: vi.fn(),
}))

// Mock use-api to prevent real API calls
vi.mock('@/hooks/use-api', () => ({
	useCreateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useMoveItem: () => ({ mutate: vi.fn(), isPending: false }),
	useCreateColumn: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useRenameColumn: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useDeleteColumn: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useUpdateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

import { BoardView } from './BoardView'
import { useBoardData } from '@/hooks/use-board-data'

const mockedUseBoardData = vi.mocked(useBoardData)

function renderWithProviders(ui: React.ReactElement) {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('BoardView', () => {
	it('shows loading skeleton while data loads', () => {
		mockedUseBoardData.mockReturnValue({
			columns: [],
			itemsByColumn: {},
			isLoading: true,
			error: null,
		})
		renderWithProviders(<BoardView boardId="brd_1" />)
		// BoardSkeleton renders animated pulse divs
		expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
	})

	it('shows empty state when board has no columns', () => {
		mockedUseBoardData.mockReturnValue({
			columns: [],
			itemsByColumn: {},
			isLoading: false,
			error: null,
		})
		renderWithProviders(<BoardView boardId="brd_1" />)
		expect(screen.getByText('This board has no columns')).toBeInTheDocument()
	})

	it('renders columns in horizontal scroll container', () => {
		mockedUseBoardData.mockReturnValue({
			columns: [
				{
					id: 'col_1',
					name: 'Todo',
					position: 'a0',
					boardId: 'brd_1',
					createdAt: '',
					updatedAt: '',
				},
				{
					id: 'col_2',
					name: 'Done',
					position: 'a1',
					boardId: 'brd_1',
					createdAt: '',
					updatedAt: '',
				},
			],
			itemsByColumn: { col_1: [], col_2: [] },
			isLoading: false,
			error: null,
		})
		renderWithProviders(<BoardView boardId="brd_1" />)
		expect(screen.getByText('Todo')).toBeInTheDocument()
		expect(screen.getByText('Done')).toBeInTheDocument()
	})
})
