export const LABEL_COLORS = [
	{ name: 'red', bg: 'bg-red-500', text: 'text-white', darkBg: 'dark:bg-red-600' },
	{ name: 'orange', bg: 'bg-orange-500', text: 'text-white', darkBg: 'dark:bg-orange-600' },
	{ name: 'yellow', bg: 'bg-yellow-400', text: 'text-gray-900', darkBg: 'dark:bg-yellow-500' },
	{ name: 'green', bg: 'bg-green-500', text: 'text-white', darkBg: 'dark:bg-green-600' },
	{ name: 'blue', bg: 'bg-blue-500', text: 'text-white', darkBg: 'dark:bg-blue-600' },
	{ name: 'purple', bg: 'bg-purple-500', text: 'text-white', darkBg: 'dark:bg-purple-600' },
	{ name: 'pink', bg: 'bg-pink-500', text: 'text-white', darkBg: 'dark:bg-pink-600' },
	{ name: 'gray', bg: 'bg-gray-500', text: 'text-white', darkBg: 'dark:bg-gray-600' },
] as const

export type LabelColor = (typeof LABEL_COLORS)[number]['name']

export function getLabelStyle(colorName: string) {
	return LABEL_COLORS.find((c) => c.name === colorName) ?? LABEL_COLORS[7]
}
