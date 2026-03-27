import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Mock ResizeObserver for @dnd-kit (not available in jsdom)
globalThis.ResizeObserver ??= class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof globalThis.ResizeObserver

// Mock next-themes
vi.mock('next-themes', () => ({
	useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
	usePathname: () => '/',
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({}),
}))
