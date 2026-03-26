export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-[400px] rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
				<h1 className="mb-6 text-2xl font-semibold leading-tight text-gray-900">{title}</h1>
				{children}
			</div>
		</div>
	)
}
