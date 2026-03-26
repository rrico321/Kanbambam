import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
	const cookieStore = await cookies()
	const token = cookieStore.get('access_token')

	if (!token) {
		redirect('/auth/login')
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="rounded-lg bg-white p-8 shadow-sm text-center">
				<h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Kanbambam</h1>
				<p className="text-gray-600 mb-6">You are logged in. Dashboard coming soon.</p>
				<a
					href="/auth/logout"
					className="text-sm text-blue-600 hover:text-blue-500"
				>
					Log out
				</a>
			</div>
		</main>
	)
}
