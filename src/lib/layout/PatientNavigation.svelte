<!-- src/lib/layout/PatientNavigation.svelte -->
<script lang="ts">
	import type { PatientSection } from '#lib/features/patient/navigation.js';

	type Props = {
		patientId: string;
		activeSection: PatientSection;
	};

	let { patientId, activeSection }: Props = $props();

	const items = [
		{ section: 'problems', label: 'Problemas' },
		{ section: 'exams', label: 'Exames' },
		{ section: 'medications', label: 'Medicações' }
	] as const;

	const patientPath = $derived(`/patients/${encodeURIComponent(patientId)}`);
</script>

<nav
	class="sticky top-6 grid w-16 gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-sm"
	aria-label="Área clínica do paciente"
>
	{#each items as item (item.section)}
		<a
			href={`${patientPath}?tab=${item.section}`}
			aria-label={item.label}
			aria-current={activeSection === item.section ? 'page' : undefined}
			title={item.label}
			class={`group relative flex size-12 items-center justify-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
				activeSection === item.section
					? 'bg-brand-container text-on-brand-container'
					: 'text-on-surface-muted hover:bg-surface-muted hover:text-on-surface'
			}`}
		>
			{#if item.section === 'problems'}
				<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
					<path
						d="M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-12v4m0 3h.01M9 2h6"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{:else if item.section === 'exams'}
				<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
					<path
						d="M9 3h6m-5 0v5l-5 9a3 3 0 0 0 2.62 4.5h8.76A3 3 0 0 0 19 17l-5-9V3M7.5 15h9"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
					<path
						d="m10.5 5.5 8 8a4.24 4.24 0 0 1-6 6l-8-8a4.24 4.24 0 0 1 6-6ZM8 15l7-7"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
			<span
				class="pointer-events-none absolute right-full z-10 mr-3 rounded-lg bg-on-surface px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-surface opacity-0 shadow-md transition group-hover:opacity-100 group-focus-visible:opacity-100"
			>
				{item.label}
			</span>
		</a>
	{/each}
</nav>
