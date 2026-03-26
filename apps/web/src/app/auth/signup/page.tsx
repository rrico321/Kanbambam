'use client'
import { useActionState } from 'react'
import { AuthCard } from '@/components/AuthCard'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormField } from '@/components/FormField'
import { SubmitButton } from '@/components/SubmitButton'
import { AuthLink } from '@/components/AuthLink'
import { type SignupState, signupAction } from './actions'

export default function SignupPage() {
	const [state, formAction] = useActionState<SignupState, FormData>(signupAction, {})

	return (
		<AuthCard title="Create your account">
			{state.error && <ErrorAlert message={state.error} />}
			<form action={formAction}>
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
				<FormField
					label="Confirm password"
					name="confirmPassword"
					type="password"
					error={state.fieldErrors?.confirmPassword}
				/>
				<SubmitButton loadingText="Creating account...">Create account</SubmitButton>
			</form>
			<AuthLink text="Already have an account?" linkText="Log in" href="/auth/login" />
		</AuthCard>
	)
}
