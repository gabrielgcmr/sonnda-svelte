<!-- src/lib/ui/SelectField.svelte -->
<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type SelectOption = { value: string; label: string };
	type Props = Omit<
		HTMLSelectAttributes,
		'aria-describedby' | 'aria-invalid' | 'children' | 'class' | 'id' | 'name' | 'value'
	> & {
		id: string;
		name: string;
		label: string;
		options: readonly SelectOption[];
		value?: string;
		placeholder?: string;
		required?: boolean;
		error?: string | null;
		helper?: string;
		class?: string;
	};

	let {
		id,
		name,
		label,
		options,
		value = $bindable(''),
		placeholder = 'Selecione',
		required = false,
		error = null,
		helper,
		class: className = '',
		...selectAttributes
	}: Props = $props();

	const descriptionId = $derived(error ? `${id}-error` : helper ? `${id}-helper` : undefined);
</script>

<div>
	<label for={id} class="mb-2 block text-sm font-medium text-on-surface">
		{label}
		{#if required}<span class="text-danger" aria-hidden="true"> *</span>{/if}
	</label>
	<select
		{...selectAttributes}
		{id}
		{name}
		bind:value
		{required}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={descriptionId}
		class={`w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-on-surface transition outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-surface-muted ${className}`}
	>
		<option value="" disabled>{placeholder}</option>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<p id={`${id}-error`} class="mt-2 text-sm text-danger">{error}</p>
	{:else if helper}
		<p id={`${id}-helper`} class="mt-2 text-sm text-on-surface-muted">{helper}</p>
	{/if}
</div>
