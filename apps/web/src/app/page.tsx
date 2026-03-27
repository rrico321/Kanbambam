import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { HomeRedirect } from './HomeRedirect'

export default async function Home() {
	const cookieStore = await cookies()
	const token = cookieStore.get('access_token')

	if (!token) {
		redirect('/auth/login')
	}

	// Client component handles localStorage check for last board
	return <HomeRedirect />
}
