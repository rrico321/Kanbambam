import { readFileSync } from 'node:fs'

// Replaced at build time by tsup (see tsup.config.ts) with the version from package.json
declare const __CLI_VERSION__: string | undefined

function readPackageVersion(): string {
	// Unbundled runs (tsx dev, tests): src/lib/version.ts -> ../../package.json
	const pkgUrl = new URL('../../package.json', import.meta.url)
	return (JSON.parse(readFileSync(pkgUrl, 'utf-8')) as { version: string }).version
}

export const VERSION: string =
	typeof __CLI_VERSION__ === 'string' ? __CLI_VERSION__ : readPackageVersion()
