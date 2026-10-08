<!-- src/routes/(app)/home/exams/+page.svelte -->
<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
</script>

<svelte:head>
	<title>Extrair exames | Sonnda</title>
	<meta name="description" content="Extraia informações de exames laboratoriais." />
</svelte:head>

<section aria-labelledby="exams-title">
	<p class="text-sm font-semibold text-brand">Ferramentas</p>
	<h1 id="exams-title" class="mt-2 text-3xl font-semibold tracking-tight">Extrair exames</h1>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
		Extraia informações de um exame laboratorial sem vinculá-lo a um paciente.
	</p>

	<Card class="mt-8">
		<p class="text-sm font-semibold text-brand">Em breve</p>
		<h2 class="mt-2 text-lg font-semibold">Extração independente de exames</h2>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-on-surface-muted">
			O envio do PDF e a visualização do resultado serão implementados em uma próxima etapa.
		</p>
	</Card>
</section>
