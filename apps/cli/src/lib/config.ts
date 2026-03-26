import Conf from 'conf'

interface KanbambamConfig {
	accessToken?: string
	refreshToken?: string
	apiBaseUrl: string
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
