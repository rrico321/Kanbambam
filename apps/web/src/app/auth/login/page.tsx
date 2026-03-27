'use client'
import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthCard } from '@/components/AuthCard'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormField } from '@/components/FormField'
import { SubmitButton } from '@/components/SubmitButton'
import { AuthLink } from '@/components/AuthLink'
import { type LoginState, loginAction } from './actions'

function LoginForm() {
	const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {})
	const searchParams = useSearchParams()
	const cliCallback = searchParams.get('cli_callback')
	const cliState = searchParams.get('state')
	const errorFromRedirect = searchParams.get('error')
	const isCli = !!(cliCallback && cliState)

	const displayError = state.error || errorFromRedirect

	return (
		<AuthCard title="Log in to Kanbambam">
			{displayError && <ErrorAlert message={displayError} />}
			<form action={isCli ? '/api/auth/cli-login' : formAction} method={isCli ? 'POST' : undefined}>
				{cliCallback && <input type="hidden" name="cli_callback" value={cliCallback} />}
				{cliState && <input type="hidden" name="state" value={cliState} />}
				<FormField
					label="Email"
					name="email"
					type="email"
					placeholder="you@example.com"
					error={state.fieldErrors?.email}
				/>
				<FormField
					label="Password"
					name="password"
					type="password"
					error={state.fieldErrors?.password}
				/>
				<SubmitButton loadingText="Logging in...">Log in</SubmitButton>
			</form>
			<AuthLink text="Don't have an account?" linkText="Sign up" href="/auth/signup" />
		</AuthCard>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={
			<AuthCard title="Log in to Kanbambam">
				<div className="text-center text-gray-400 py-4">Loading...</div>
			</AuthCard>
		}>
			<LoginForm />
		</Suspense>
	)
}
