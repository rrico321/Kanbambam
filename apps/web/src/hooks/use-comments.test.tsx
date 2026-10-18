import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fake server: comments c1..cN stored oldest-first, served newest-first with cursor paging
let server: { id: string }[] = []
const mockGet = vi.fn(async (path: string) => {
	const url = new URL(path, 'http://x')
	const limit = Number(url.searchParams.get('limit'))
	const cursor = url.searchParams.get('cursor')
	expect(url.searchParams.get('order')).toBe('desc')
	const newestFirst = [...server].reverse()
	const start = cursor ? newestFirst.findIndex((c) => c.id === cursor) + 1 : 0
	const rows = newestFirst.slice(start, start + limit + 1)
	const hasMore = rows.length > limit
	const data = hasMore ? rows.slice(0, limit) : rows
	return { data, meta: { total: server.length, cursor: hasMore ? data[data.length - 1].id : null } }
})
vi.mock('@/lib/api', () => ({
	api: { get: (path: string) => mockGet(path) },
}))

import { useComments } from './use-api'

function setup() {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={qc}>{children}</QueryClientProvider>
	)
	return { qc, ...renderHook(() => useComments('itm_1'), { wrapper }) }
}

const ids = (c: { id: string }[] | undefined) => c?.map((x) => x.id)

describe('useComments', () => {
	beforeEach(() => {
		mockGet.mockClear()
		server = Array.from({ length: 120 }, (_, i) => ({ id: `c${i + 1}` }))
	})

	it('loads the newest page and shows it oldest-first', async () => {
		const { result } = setup()
		await waitFor(() => expect(result.current.comments).toBeDefined())
		expect(result.current.comments).toHaveLength(50)
		expect(ids(result.current.comments)?.[0]).toBe('c71')
		expect(ids(result.current.comments)?.at(-1)).toBe('c120')
		expect(result.current.hasOlder).toBe(true)
	})

	it('loads older pages in front until the thread is complete', async () => {
		const { result } = setup()
		await waitFor(() => expect(result.current.comments).toBeDefined())

		await act(async () => {
			await result.current.loadOlder()
		})
		await waitFor(() => expect(result.current.comments).toHaveLength(100))
		expect(ids(result.current.comments)?.[0]).toBe('c21')

		await act(async () => {
			await result.current.loadOlder()
		})
		await waitFor(() => expect(result.current.comments).toHaveLength(120))
		expect(ids(result.current.comments)?.[0]).toBe('c1')
		expect(ids(result.current.comments)?.at(-1)).toBe('c120')
		expect(result.current.hasOlder).toBe(false)
	})

	it('shows a new comment at the end even when the thread is over 100', async () => {
		const { result, qc } = setup()
		await waitFor(() => expect(result.current.comments).toBeDefined())

		server.push({ id: 'c121' })
		await act(async () => {
			await qc.invalidateQueries({ queryKey: ['items', 'itm_1', 'comments'] })
		})
		await waitFor(() => expect(ids(result.current.comments)?.at(-1)).toBe('c121'))
		expect(result.current.comments).toHaveLength(50)
	})
})
