export function FormField({
	label,
	name,
	type,
	error,
	placeholder,
}: {
	label: string
	name: string
	type: string
	error?: string
	placeholder?: string
}) {
	return (
		<div className="mb-4">
			<label
				htmlFor={name}
				className="mb-2 block text-sm font-semibold leading-snug text-gray-500"
			>
				{label}
			</label>
			<input
				id={name}
				name={name}
				type={type}
				placeholder={placeholder}
				className={`w-full rounded-lg border px-3 py-3 text-base text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600 ${
					error ? 'border-red-500 ring-red-500' : 'border-gray-300'
				}`}
			/>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	)
}
