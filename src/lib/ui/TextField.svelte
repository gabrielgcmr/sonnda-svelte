<!-- src/lib/ui/TextField.svelte -->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<
		HTMLInputAttributes,
		| 'aria-describedby'
		| 'aria-invalid'
		| 'children'
		| 'class'
		| 'id'
		| 'name'
		| 'required'
		| 'type'
		| 'value'
	> & {
		id: string;
		name: string;
		label: string;
		value?: string;
		type?: HTMLInputAttributes['type'];
		required?: boolean;
		error?: string | null;
		invalid?: boolean;
		helper?: string;
		class?: string;
		'aria-describedby'?: string;
	};

	let {
		id,
		name,
		label,
		value = $bindable(''),
		type = 'text',
		required = false,
		error = null,
		invalid = false,
		helper,
		class: className = '',
		'aria-describedby': externalDescriptionId,
		...inputAttributes
	}: Props = $props();

	const localDescriptionId = $derived(error ? `${id}-error` : helper ? `${id}-helper` : undefined);
	const descriptionId = $derived(
		[externalDescriptionId, localDescriptionId].filter(Boolean).join(' ') || undefined
	);
</script>

<div>
	<label for={id} class="mb-2 block text-sm font-medium text-on-surface">
		{label}
		{#if required}<span class="text-danger" aria-hidden="true"> *</span>{/if}
	</label>
	<input
		{...inputAttributes}
		{id}
		{name}
		{type}
		bind:value
		{required}
		aria-invalid={error || invalid ? 'true' : undefined}
		aria-describedby={descriptionId}
		class={`w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-on-surface transition outline-none placeholder:text-on-surface-muted focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-surface-muted ${className}`}
	/>
	{#if error}
		<p id={`${id}-error`} class="mt-2 text-sm text-danger">{error}</p>
	{:else if helper}
		<p id={`${id}-helper`} class="mt-2 text-sm text-on-surface-muted">{helper}</p>
	{/if}
</div>
