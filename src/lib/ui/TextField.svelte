<!-- src/lib/ui/TextField.svelte -->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		id: string;
		name: string;
		label: string;
		value?: string;
		type?: 'text' | 'email' | 'password' | 'tel' | 'date';
		placeholder?: string;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		inputmode?: HTMLInputAttributes['inputmode'];
		disabled?: boolean;
		required?: boolean;
		error?: string | null;
		invalid?: boolean;
		helper?: string;
	};

	let {
		id,
		name,
		label,
		value = $bindable(''),
		type = 'text',
		placeholder,
		autocomplete,
		inputmode,
		disabled = false,
		required = false,
		error = null,
		invalid = false,
		helper
	}: Props = $props();

	const descriptionId = $derived(error ? `${id}-error` : helper ? `${id}-helper` : undefined);
</script>

<div>
	<label for={id} class="mb-2 block text-sm font-medium text-on-surface">
		{label}
		{#if required}<span class="text-danger" aria-hidden="true"> *</span>{/if}
	</label>
	<input
		{id}
		{name}
		{type}
		bind:value
		{placeholder}
		{autocomplete}
		{inputmode}
		{disabled}
		{required}
		aria-invalid={error || invalid ? 'true' : undefined}
		aria-describedby={descriptionId}
		class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-on-surface transition outline-none placeholder:text-on-surface-muted focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-surface-muted"
	/>
	{#if error}
		<p id={`${id}-error`} class="mt-2 text-sm text-danger">{error}</p>
	{:else if helper}
		<p id={`${id}-helper`} class="mt-2 text-sm text-on-surface-muted">{helper}</p>
	{/if}
</div>
