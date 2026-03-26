import { nanoid } from 'nanoid'

const PREFIXES = {
	workspace: 'wks',
	board: 'brd',
	column: 'col',
	item: 'itm',
	user: 'usr',
	refreshToken: 'rtk',
} as const

type EntityType = keyof typeof PREFIXES

export function generateId(type: EntityType): string {
	return `${PREFIXES[type]}_${nanoid(12)}`
}
