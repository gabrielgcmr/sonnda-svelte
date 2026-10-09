<!-- src/routes/(app)/home/exams/+page.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import LabExtractionResult from '#lib/features/labextraction/LabExtractionResult.svelte';
	import { LabExtractionState } from '#lib/features/labextraction/labExtraction.svelte.js';
	import {
		copyExtractionSummary,
		formatFileSize
	} from '#lib/features/labextraction/presentation.js';
	import type { LabExtractionProblem } from '#lib/features/labextraction/types.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';

	const extraction = new LabExtractionState();
	const accountId = $derived(currentAccount.account?.id ?? null);
	let fileInput = $state<HTMLInputElement>();
	let copyState = $state<'idle' | 'copied' | 'error'>('idle');

	$effect(() => {
		const accountChanged = extraction.bindAccount(accountId);
		if (accountChanged && fileInput) fileInput.value = '';
		if (accountChanged) copyState = 'idle';
	});
	onDestroy(() => extraction.clear());

	function problemMessage(problem: LabExtractionProblem) {
		if (problem.status === 413) return 'O PDF ultrapassa o limite de 10 MB.';
		if (problem.status === 415) return 'A API não reconheceu o arquivo como PDF.';
		return problem.detail || problem.title || 'Não foi possível extrair os dados do exame.';
	}

	async function handleFileChange(event: Event) {
		copyState = 'idle';
		const input = event.currentTarget as HTMLInputElement;
		const accepted = await extraction.selectFile(input.files?.[0] ?? null);
		if (!accepted) input.value = '';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		await runExtraction();
	}

	async function runExtraction() {
		const accessToken = auth.session?.access_token;
		if (!extraction.requireFile()) {
			fileInput?.focus();
			return;
		}
		if (!accessToken || !accountId || extraction.status === 'processing') return;
		copyState = 'idle';
		await extraction.extract(accessToken, accountId);
	}

	async function copySummary() {
		const summary = extraction.result?.summary_text ?? '';
		const clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard;
		copyState = (await copyExtractionSummary(summary, clipboard)) ? 'copied' : 'error';
	}

	function startOver() {
		extraction.startOver();
		copyState = 'idle';
		if (fileInput) fileInput.value = '';
		fileInput?.focus();
	}
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

	<Alert variant="info" class="mt-6 max-w-3xl">
		Esta operação é independente de paciente. O PDF e o resultado não são salvos pelo Sonnda.
	</Alert>

	<div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)]">
		<Card class="lg:sticky lg:top-6">
			<form aria-labelledby="exam-upload-title" onsubmit={handleSubmit} novalidate>
				<p class="text-sm font-semibold text-brand">Arquivo temporário</p>
				<h2 id="exam-upload-title" class="mt-2 text-lg font-semibold">Enviar PDF</h2>
				<p class="mt-2 text-sm leading-6 text-on-surface-muted">
					Selecione um exame laboratorial para gerar um resumo temporário.
				</p>

				<label for="exam-file" class="mt-6 block text-sm font-medium text-on-surface">
					PDF laboratorial <span class="text-danger" aria-hidden="true">*</span>
				</label>
				<input
					bind:this={fileInput}
					id="exam-file"
					name="file"
					type="file"
					accept="application/pdf,.pdf"
					required
					disabled={extraction.status === 'processing' || extraction.checkingFile}
					aria-invalid={extraction.fileError ? 'true' : undefined}
					aria-describedby={extraction.fileError ? 'exam-file-error' : 'exam-file-helper'}
					onchange={handleFileChange}
					class="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-on-surface file:mr-4 file:rounded-lg file:border-0 file:bg-brand-container file:px-3 file:py-2 file:font-semibold file:text-on-brand-container disabled:cursor-not-allowed disabled:bg-surface-muted"
				/>
				{#if extraction.fileError}
					<p id="exam-file-error" class="mt-2 text-sm text-danger">{extraction.fileError}</p>
				{:else}
					<p id="exam-file-helper" class="mt-2 text-sm leading-6 text-on-surface-muted">
						PDF com até 10 MB. O conteúdo também será verificado antes do envio.
					</p>
				{/if}

				{#if extraction.file}
					<div class="mt-4 rounded-xl border border-border bg-surface-muted p-3 text-sm">
						<p class="truncate font-medium">{extraction.file.name}</p>
						<p class="mt-1 text-on-surface-muted">{formatFileSize(extraction.file.size)}</p>
					</div>
				{/if}

				<Button
					type="submit"
					class="mt-6 w-full"
					loading={extraction.status === 'processing'}
					disabled={extraction.checkingFile}
				>
					{extraction.status === 'processing' ? 'Extraindo...' : 'Extrair dados'}
				</Button>
			</form>
		</Card>

		<Card class="min-h-96">
			{#if extraction.status === 'processing'}
				<div
					class="grid min-h-80 place-items-center text-center"
					aria-live="polite"
					aria-busy="true"
				>
					<div class="max-w-sm">
						<span
							class="mx-auto block size-10 animate-spin rounded-full border-4 border-brand/25 border-t-brand"
							aria-hidden="true"
						></span>
						<h2 class="mt-5 text-lg font-semibold">Processando o exame</h2>
						<p class="mt-2 text-sm leading-6 text-on-surface-muted">
							A extração pode levar alguns instantes. Mantenha esta página aberta.
						</p>
					</div>
				</div>
			{:else if extraction.result}
				<LabExtractionResult
					result={extraction.result}
					{copyState}
					onCopy={copySummary}
					onStartOver={startOver}
				/>
			{:else if extraction.status === 'error'}
				<div aria-live="polite">
					<p class="text-sm font-semibold text-brand">Resultado</p>
					<h2 class="mt-2 text-lg font-semibold">Não foi possível concluir a extração</h2>
					{#if extraction.problem}
						<Alert variant="error" class="mt-5">{problemMessage(extraction.problem)}</Alert>
					{/if}
					<p class="mt-4 text-sm leading-6 text-on-surface-muted">
						O arquivo selecionado foi mantido apenas nesta página para você tentar novamente.
					</p>
					<Button variant="secondary" class="mt-5" onclick={runExtraction}>Tentar novamente</Button>
				</div>
			{:else}
				<div class="grid min-h-80 place-items-center text-center" aria-live="polite">
					<div class="max-w-sm">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							class="mx-auto size-8 text-brand"
							aria-hidden="true"
						>
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
							O resumo temporário será apresentado aqui após o processamento.
						</p>
					</div>
				</div>
			{/if}
		</Card>
	</div>
</section>
