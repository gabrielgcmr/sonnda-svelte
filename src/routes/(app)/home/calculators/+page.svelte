<!-- src/routes/(app)/home/calculators/+page.svelte -->
<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
</script>

<svelte:head>
	<title>Cálculos clínicos | Sonnda</title>
	<meta
		name="description"
		content="Acesse cálculos clínicos para apoiar a avaliação de pacientes."
	/>
</svelte:head>

<section aria-labelledby="calculators-title">
	<p class="text-sm font-semibold text-brand">Ferramentas</p>
	<h1 id="calculators-title" class="mt-2 text-3xl font-semibold tracking-tight">
		Cálculos clínicos
	</h1>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
		Use calculadoras clínicas independentes do cadastro de pacientes.
	</p>

	<Card class="mt-8">
		<div class="flex items-start justify-between gap-6">
			<div>
				<p class="text-sm font-semibold text-brand">FIB-4</p>
				<h2 class="mt-2 text-lg font-semibold">Avaliação de fibrose hepática</h2>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-on-surface-muted">
					A primeira calculadora clínica será disponibilizada em uma próxima etapa.
				</p>
			</div>
			<span
				class="shrink-0 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-on-surface-muted"
			>
				Em breve
			</span>
		</div>
	</Card>
</section>
