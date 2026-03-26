'use client'
import { use, useActionState } from 'react'
import { AuthCard } from '@/components/AuthCard'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormField } from '@/components/FormField'
import { SubmitButton } from '@/components/SubmitButton'
import { AuthLink } from '@/components/AuthLink'
import { type LoginState, loginAction } from './actions'

export default function LoginPage({
	searchParams,
}: { searchParams: Promise<{ cli_callback?: string; state?: string }> }) {
	const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {})

	return (
		<AuthCard title="Log in to Kanbambam">
			{state.error && <ErrorAlert message={state.error} />}
			<form action={formAction}>
				<HiddenCliFields searchParams={searchParams} />
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

function HiddenCliFields({
	searchParams,
}: { searchParams: Promise<{ cli_callback?: string; state?: string }> }) {
	const params = use(searchParams)
	return (
		<>
			{params.cli_callback && (
				<input type="hidden" name="cli_callback" value={params.cli_callback} />
			)}
			{params.state && <input type="hidden" name="state" value={params.state} />}
		</>
	)
}
