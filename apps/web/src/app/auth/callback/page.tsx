'use client'
import { use } from 'react'
import { AuthCard } from '@/components/AuthCard'

export default function CallbackPage({
	searchParams,
}: { searchParams: Promise<{ success?: string; error?: string }> }) {
	const params = use(searchParams)

	if (params.success === 'true') {
		return (
			<AuthCard title="Authentication successful">
				<p className="text-center text-base text-green-600">
					You can close this tab and return to the CLI.
				</p>
			</AuthCard>
		)
	}

	if (params.error) {
		return (
			<AuthCard title="Authentication failed">
				<p className="text-center text-base text-red-600">
					Authentication failed. Return to the CLI and try again.
				</p>
			</AuthCard>
		)
	}

	return (
		<AuthCard title="Completing authentication...">
			<div className="flex justify-center">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
			</div>
		</AuthCard>
	)
}
