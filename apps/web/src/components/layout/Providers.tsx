'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { makeQueryClient } from '@/lib/query-client'

let browserQueryClient: ReturnType<typeof makeQueryClient> | undefined

function getQueryClient() {
	if (typeof window === 'undefined') return makeQueryClient()
	if (!browserQueryClient) browserQueryClient = makeQueryClient()
	return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
				{children}
				<Toaster richColors position="bottom-right" />
			</ThemeProvider>
		</QueryClientProvider>
	)
}
