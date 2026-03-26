import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts'],
		setupFiles: ['src/test-helpers/setup.ts'],
		env: {
			NODE_ENV: 'test',
		},
		envFile: '.env.test',
	},
})
