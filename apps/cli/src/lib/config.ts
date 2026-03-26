import Conf from 'conf'

export interface ContextEntry {
	id: string
	name: string
}

interface KanbambamConfig {
	accessToken?: string
	refreshToken?: string
	apiBaseUrl: string
	activeWorkspace?: ContextEntry
	activeBoard?: ContextEntry
}

export const config = new Conf<KanbambamConfig>({
	projectName: 'kanbambam',
	defaults: {
		apiBaseUrl: 'http://localhost:3000',
	},
})

export function clearTokens(): void {
	config.delete('accessToken')
	config.delete('refreshToken')
}

export function hasTokens(): boolean {
	return !!(config.get('accessToken') && config.get('refreshToken'))
}

export function clearContext(): void {
	config.delete('activeWorkspace')
	config.delete('activeBoard')
}
