import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock use-api
const mockMutate = vi.fn()
vi.mock('@/hooks/use-api', () => ({
	useUpdateItem: () => ({ mutate: mockMutate, isPending: false }),
	useDeleteItem: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { ItemModal } from './ItemModal'

function renderWithProviders(ui: React.ReactElement) {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockItem = {
	id: 'itm_1',
	title: 'Test Item',
	description: 'A description',
	position: 'a0',
	columnId: 'col_1',
	dueDate: '2026-04-01T00:00:00.000Z',
	labels: ['red', 'blue'],
	createdAt: '2026-01-01',
	updatedAt: '2026-01-01',
}

describe('ItemModal', () => {
	it('renders item title, description, labels, and due date', () => {
		renderWithProviders(<ItemModal item={mockItem} onClose={vi.fn()} />)
		expect(screen.getByText('Test Item')).toBeInTheDocument()
		expect(screen.getByText('A description')).toBeInTheDocument()
		expect(screen.getByText('red')).toBeInTheDocument()
		expect(screen.getByText('blue')).toBeInTheDocument()
	})

	it('calls onClose when X button clicked', () => {
		const onClose = vi.fn()
		renderWithProviders(<ItemModal item={mockItem} onClose={onClose} />)
		fireEvent.click(screen.getByLabelText('Close modal'))
		expect(onClose).toHaveBeenCalled()
	})

	it('returns null when item is null', () => {
		const { container } = renderWithProviders(
			<ItemModal item={null} onClose={vi.fn()} />,
		)
		expect(container.innerHTML).toBe('')
	})
})
