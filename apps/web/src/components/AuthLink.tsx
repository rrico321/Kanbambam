import Link from 'next/link'

export function AuthLink({
	text,
	linkText,
	href,
}: { text: string; linkText: string; href: string }) {
	return (
		<p className="mt-4 text-center text-sm text-gray-500">
			{text}{' '}
			<Link href={href} className="font-semibold text-blue-600 hover:text-blue-700">
				{linkText}
			</Link>
		</p>
	)
}
