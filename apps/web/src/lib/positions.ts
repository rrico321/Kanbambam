import { generateKeyBetween } from 'fractional-indexing'

export function calculatePosition(
	items: { position: string }[],
	targetIndex: number,
): string {
	const sorted = [...items].sort((a, b) => (a.position < b.position ? -1 : 1))
	const before = targetIndex > 0 ? (sorted[targetIndex - 1]?.position ?? null) : null
	const after = targetIndex < sorted.length ? (sorted[targetIndex]?.position ?? null) : null
	return generateKeyBetween(before, after)
}
