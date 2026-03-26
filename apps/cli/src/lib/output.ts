import { render } from 'ink'
import type React from 'react'
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

export function outputInk(component: React.ReactElement): void {
	render(component)
}

export function output<T>(data: T, meta: Record<string, unknown>, options: {
	mode: OutputMode
	inkComponent: React.ReactElement
	plainText: string
}): void {
	switch (options.mode) {
		case 'json':
			outputJson(data, meta)
			break
		case 'plain':
			outputPlain(options.plainText)
			break
		case 'ink':
			outputInk(options.inkComponent)
			break
	}
}
