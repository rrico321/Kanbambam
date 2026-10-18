import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string
}

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	target: 'node20',
	clean: true,
	dts: false,
	banner: { js: '#!/usr/bin/env node' },
	define: { __CLI_VERSION__: JSON.stringify(pkg.version) },
	noExternal: ['@kanbambam/shared'],
})
