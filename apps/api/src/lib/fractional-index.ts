import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

export function appendPosition(lastPosition: string | null): string {
	return generateKeyBetween(lastPosition, null)
}

export function insertBetween(before: string | null, after: string | null): string {
	return generateKeyBetween(before, after)
}

export function generatePositions(count: number, after?: string | null): string[] {
	return generateNKeysBetween(after ?? null, null, count)
}
