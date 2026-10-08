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

	<div class="mt-8 grid grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)] items-stretch gap-6">
		<Card>
			<form aria-labelledby="exam-upload-title">
				<p class="text-sm font-semibold text-brand">Em breve</p>
				<h2 id="exam-upload-title" class="mt-2 text-lg font-semibold">Enviar PDF</h2>
				<p class="mt-2 text-sm leading-6 text-on-surface-muted">
					Selecione um exame laboratorial para gerar um resumo temporário.
				</p>

				<label for="exam-file" class="mt-6 block text-sm font-medium text-on-surface">
					PDF laboratorial
				</label>
				<input
					id="exam-file"
					type="file"
					accept="application/pdf,.pdf"
					disabled
					aria-describedby="exam-file-helper"
					class="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-on-surface file:mr-4 file:rounded-lg file:border-0 file:bg-brand-container file:px-3 file:py-2 file:font-semibold file:text-on-brand-container disabled:cursor-not-allowed"
				/>
				<p id="exam-file-helper" class="mt-2 text-sm leading-6 text-on-surface-muted">
					PDF com texto selecionável, até 10 MB.
				</p>

				<button
					type="submit"
					disabled
					class="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-surface-strong px-5 py-3 font-semibold text-on-surface-muted"
				>
					Extrair dados
				</button>
			</form>
		</Card>

		<Card class="flex flex-col">
			<div>
				<p class="text-sm font-semibold text-brand">Resultado</p>
				<h2 class="mt-2 text-lg font-semibold">Resumo extraído</h2>
			</div>
			<div
				class="mt-6 grid min-h-64 flex-1 place-items-center rounded-xl border border-dashed border-border-strong bg-surface-muted p-6 text-center"
				aria-live="polite"
			>
				<div class="max-w-sm">
					<svg viewBox="0 0 24 24" fill="none" class="mx-auto size-8 text-brand" aria-hidden="true">
						<path
							d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-6-6 6 6m-6-6v6h6M8 13h8m-8 4h5"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<p class="mt-4 font-medium">Nenhum exame enviado</p>
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						O resumo temporário será apresentado aqui após a integração com a API.
					</p>
				</div>
			</div>
		</Card>
	</div>
</section>
