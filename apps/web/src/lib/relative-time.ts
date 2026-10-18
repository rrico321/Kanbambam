const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 60 * 60],
	['month', 30 * 24 * 60 * 60],
	['day', 24 * 60 * 60],
	['hour', 60 * 60],
	['minute', 60],
]

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "just now", "5 minutes ago", "yesterday", ... */
export function relativeTime(iso: string, now: Date = new Date()): string {
	const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
	const abs = Math.abs(seconds)
	if (abs < 45) return 'just now'
	for (const [unit, size] of UNITS) {
		if (abs >= size) return formatter.format(Math.round(seconds / size), unit)
	}
	return formatter.format(Math.round(seconds / 60), 'minute')
}
