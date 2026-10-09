<!-- src/lib/features/patient/RelationField.svelte -->
<script lang="ts">
	import { patientRelationOptions } from './createForm.js';

	type Props = {
		id: string;
		name: string;
		value?: string;
		allowProfessional: boolean;
		disabled?: boolean;
		error?: string | null;
		onchange?: () => void;
	};

	let {
		id,
		name,
		value = $bindable(''),
		allowProfessional,
		disabled = false,
		error = null,
		onchange
	}: Props = $props();

	const tooltipId = $derived(`${id}-professional-tooltip`);
</script>

<fieldset aria-describedby={error ? `${id}-error` : `${id}-helper`}>
	<legend class="mb-2 text-sm font-medium text-on-surface">
		Seu vínculo com o paciente <span class="text-danger" aria-hidden="true">*</span>
	</legend>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each patientRelationOptions as option, index (option.value)}
			{#if option.value === 'professional' && !allowProfessional}
				<div class="group relative">
					<div
						role="radio"
						aria-checked="false"
						aria-disabled="true"
						aria-describedby={tooltipId}
						tabindex={disabled ? undefined : 0}
						class="flex min-h-14 cursor-not-allowed items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-on-surface-muted opacity-75 outline-none focus-visible:ring-2 focus-visible:ring-brand"
					>
						<span>{option.label}</span>
						<span class="rounded-full border border-border px-2 py-0.5 text-xs font-semibold">
							Indisponível
						</span>
					</div>
					<div
						id={tooltipId}
						role="tooltip"
						class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-on-surface px-3 py-2 text-center text-xs leading-5 text-surface opacity-0 shadow-lg transition group-focus-within:opacity-100 group-hover:opacity-100"
					>
						Disponível apenas para contas do tipo Profissional.
					</div>
				</div>
			{:else}
				<label class="cursor-pointer">
					<input
						id={index === 0 ? id : `${id}-${option.value}`}
						type="radio"
						{name}
						value={option.value}
						bind:group={value}
						{disabled}
						required
						onchange={() => onchange?.()}
						class="peer sr-only"
					/>
					<span
						class="flex min-h-14 items-center rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-on-surface transition peer-checked:border-brand peer-checked:bg-brand-container peer-checked:text-on-brand-container peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:bg-surface-muted peer-disabled:opacity-70"
					>
						{option.label}
					</span>
				</label>
			{/if}
		{/each}
	</div>
	{#if error}
		<p id={`${id}-error`} class="mt-2 text-sm text-danger">{error}</p>
	{:else}
		<p id={`${id}-helper`} class="mt-2 text-sm text-on-surface-muted">
			Esse vínculo será associado ao seu acesso inicial.
		</p>
	{/if}
</fieldset>
