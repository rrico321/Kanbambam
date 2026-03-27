import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock next/navigation
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useParams: () => ({}),
}))

// Mock use-api to return test data
vi.mock('@/hooks/use-api', () => ({
	useWorkspaces: () => ({
		data: [
			{
				id: 'wks_1',
				name: 'Test Workspace',
				createdAt: '2026-01-01',
				updatedAt: '2026-01-01',
			},
		],
		isLoading: false,
	}),
	useBoards: () => ({
		data: [
			{
				id: 'brd_1',
				name: 'Test Board',
				workspaceId: 'wks_1',
				createdAt: '2026-01-01',
				updatedAt: '2026-01-01',
			},
		],
		isLoading: false,
	}),
}))

// Import after mocks
import { Sidebar } from './Sidebar'

function renderWithProviders(ui: React.ReactElement) {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Sidebar', () => {
	it('renders the app title', () => {
		renderWithProviders(<Sidebar />)
		expect(screen.getByText('Kanbambam')).toBeInTheDocument()
	})

	it('renders workspace sections with boards', () => {
		renderWithProviders(<Sidebar />)
		expect(screen.getByText('Test Workspace')).toBeInTheDocument()
		expect(screen.getByText('Test Board')).toBeInTheDocument()
	})
})
