import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Load .env.test into process.env BEFORE vitest imports any test files
// This is necessary because @t3-oss/env-core validates process.env at import time
const envTestPath = resolve(__dirname, '.env.test')
const envContent = readFileSync(envTestPath, 'utf-8')
for (const line of envContent.split('\n')) {
	const trimmed = line.trim()
	if (!trimmed || trimmed.startsWith('#')) continue
	const eqIdx = trimmed.indexOf('=')
	if (eqIdx === -1) continue
	const key = trimmed.slice(0, eqIdx)
	const value = trimmed.slice(eqIdx + 1)
	process.env[key] = value
}

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts'],
		setupFiles: ['src/test-helpers/setup.ts'],
	},
})
