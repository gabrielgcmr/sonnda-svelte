<!-- src/routes/(app)/patients/[patientId]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { patientSection } from '#lib/features/patient/navigation.js';
	import Card from '#lib/ui/Card.svelte';

	const content = {
		problems: {
			eyebrow: 'Contexto clínico',
			title: 'Problemas',
			description: 'Os problemas ativos e o histórico clínico do paciente serão exibidos aqui.'
		},
		exams: {
			eyebrow: 'Contexto clínico',
			title: 'Exames',
			description: 'Os exames e documentos clínicos vinculados ao paciente serão exibidos aqui.'
		},
		medications: {
			eyebrow: 'Contexto clínico',
			title: 'Medicações',
			description: 'As medicações em uso e seu histórico serão exibidos aqui.'
		}
	} as const;

	const selected = $derived(patientSection(page.url.searchParams.get('tab')));
	const section = $derived(content[selected]);
</script>

<svelte:head>
	<title>{section.title} do paciente | Sonnda</title>
	<meta name="description" content={section.description} />
</svelte:head>

<section aria-labelledby="patient-section-title">
	<p class="text-sm font-semibold text-brand">{section.eyebrow}</p>
	<h2 id="patient-section-title" class="mt-2 text-3xl font-semibold tracking-tight">
		{section.title}
	</h2>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">{section.description}</p>

	<Card class="mt-8">
		<div class="grid min-h-56 place-items-center text-center">
			<div class="max-w-md">
				<span
					class="inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-on-surface-muted"
				>
					Em breve
				</span>
				<h3 class="mt-4 text-lg font-semibold">{section.title} do paciente</h3>
				<p class="mt-2 text-sm leading-6 text-on-surface-muted">
					Esta área será conectada aos dados clínicos em uma implementação futura.
				</p>
			</div>
		</div>
	</Card>
</section>
