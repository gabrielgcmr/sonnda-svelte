<!-- src/routes/(app)/home/+page.svelte -->
<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
</script>

<svelte:head>
	<title>Meus pacientes | Sonnda</title>
	<meta name="description" content="Consulte os pacientes aos quais você tem acesso." />
</svelte:head>

<section aria-labelledby="patients-title">
	<p class="text-sm font-semibold text-brand">Área de trabalho</p>
	<h1 id="patients-title" class="mt-2 text-3xl font-semibold tracking-tight">Meus pacientes</h1>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
		Consulte e selecione os pacientes aos quais você tem acesso.
	</p>

	<Card class="mt-8">
		<div class="flex items-start gap-4">
			<div
				class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-container text-on-brand-container"
			>
				<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
					<path
						d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-12a4 4 0 0 1 0 7.75"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-lg font-semibold">Lista de pacientes</h2>
				<p class="mt-1 text-sm leading-6 text-on-surface-muted">
					A busca e a seleção de pacientes serão disponibilizadas na próxima etapa.
				</p>
			</div>
		</div>
	</Card>
</section>
