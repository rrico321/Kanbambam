import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

const inter = Inter({
	subsets: ['latin'],
	weight: ['400', '600'],
})

export const metadata: Metadata = {
	title: 'Kanbambam',
	description: 'CLI-first Kanban board management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
