import type { GlobalOptions } from '../types.js'

export type OutputMode = 'ink' | 'json' | 'plain'

export function detectOutputMode(flags: GlobalOptions): OutputMode {
	if (flags.json) return 'json'
	if (!process.stdout.isTTY) return 'plain'
	return 'ink'
}

export function formatJson<T>(data: T, meta: Record<string, unknown> = {}): string {
	return JSON.stringify({ data, meta }, null, 2)
}

export function outputJson<T>(data: T, meta: Record<string, unknown> = {}): void {
	console.log(formatJson(data, meta))
}

export function outputPlain(text: string): void {
	console.log(text)
}
