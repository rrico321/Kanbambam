import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const pkgVersion = (JSON.parse(readFileSync(`${root}package.json`, 'utf-8')) as { version: string })
	.version

describe('VERSION', () => {
	it('matches package.json when running from source', async () => {
		const { VERSION } = await import('../version.js')
		expect(VERSION).toBe(pkgVersion)
	})

	it('is injected into the tsup build from package.json', () => {
		const config = readFileSync(`${root}tsup.config.ts`, 'utf-8')
		expect(config).toContain('__CLI_VERSION__: JSON.stringify(pkg.version)')
		expect(config).toContain('./package.json')
	})

	it('is not hardcoded in the entrypoint', () => {
		const entry = readFileSync(`${root}src/index.ts`, 'utf-8')
		expect(entry).not.toMatch(/const VERSION\s*=/)
		expect(entry).toContain("from './lib/version.js'")
	})

	it.skipIf(!existsSync(`${root}dist/index.js`))(
		'the built binary reports the package version',
		() => {
			const out = execFileSync('node', [`${root}dist/index.js`, '--version'], { encoding: 'utf-8' })
			expect(out).toContain(pkgVersion)
		},
	)
})
