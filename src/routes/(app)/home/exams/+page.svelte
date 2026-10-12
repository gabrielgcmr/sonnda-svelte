<!-- src/routes/(app)/home/exams/+page.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import { captureLibraryPageSize } from '#lib/features/capture/captureLibrary.svelte.js';
	import {
		captureDragPresent,
		readCaptureDrag,
		type CaptureDrag
	} from '#lib/features/capture/captureDrag.js';
	import { captureSupportsStandaloneExtraction } from '#lib/features/capture/captureFile.js';
	import { listInboxCaptures } from '#lib/features/capture/desktopCaptureApi.js';
	import type { InboxCapture } from '#lib/features/capture/desktopCapture.svelte.js';
	import LabExtractionResult from '#lib/features/labextraction/LabExtractionResult.svelte';
	import { LabExtractionState } from '#lib/features/labextraction/labExtraction.svelte.js';
	import { copyExtractionSummary } from '#lib/features/labextraction/presentation.js';
	import type { LabExtractionProblem } from '#lib/features/labextraction/types.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import { formatFileSize } from '#lib/ui/formatFileSize.js';

	const unsupportedCapture = 'Use uma captura em PDF, JPEG ou PNG.';
	const receivedProblemMessage = 'Não foi possível consultar os arquivos recebidos.';

	const extraction = new LabExtractionState();
	const accountId = $derived(currentAccount.account?.id ?? null);
	let fileInput = $state<HTMLInputElement>();
	let copyState = $state<'idle' | 'copied' | 'error'>('idle');
	let captureNotice = $state<string | null>(null);
	let dragOver = $state(false);
	let receivedOpen = $state(false);
	let receivedItems = $state.raw<InboxCapture[]>([]);
	let receivedHasMore = $state(false);
	let receivedLoading = $state(false);
	let receivedLoadingMore = $state(false);
	let receivedProblem = $state<string | null>(null);
	let receivedGeneration = 0;

	$effect(() => {
		const accountChanged = extraction.bindAccount(accountId);
		if (!accountChanged) return;
		if (fileInput) fileInput.value = '';
		copyState = 'idle';
		resetReceived();
	});
	onDestroy(() => extraction.clear());

	function problemMessage(problem: LabExtractionProblem) {
		if (problem.status === 413) return 'O arquivo ultrapassa o limite de 10 MB.';
		if (problem.status === 415) return 'A API aceita arquivos PDF, JPEG ou PNG válidos.';
		return problem.detail || problem.title || 'Não foi possível extrair os dados do exame.';
	}

	function resetReceived() {
		receivedGeneration += 1;
		receivedOpen = false;
		receivedItems = [];
		receivedHasMore = false;
		receivedLoading = false;
		receivedLoadingMore = false;
		receivedProblem = null;
		captureNotice = null;
	}

	function selectReceivedCapture(capture: CaptureDrag) {
		if (!captureSupportsStandaloneExtraction(capture.mimeType)) {
			captureNotice = unsupportedCapture;
			return;
		}
		captureNotice = null;
		if (fileInput) fileInput.value = '';
		extraction.selectCapture({ id: capture.id, original_filename: capture.name });
	}

	async function handleFileChange(event: Event) {
		copyState = 'idle';
		captureNotice = null;
		const input = event.currentTarget as HTMLInputElement;
		const accepted = await extraction.selectFile(input.files?.[0] ?? null);
		if (!accepted) input.value = '';
	}

	function onDragOver(event: DragEvent) {
		const transfer = event.dataTransfer;
		if (!transfer) return;
		const acceptsCapture = captureDragPresent(transfer);
		const acceptsLocalFile = transfer.types.includes('Files');
		if (!acceptsCapture && !acceptsLocalFile) return;
		event.preventDefault();
		transfer.dropEffect = 'copy';
		dragOver = true;
	}

	function onDragLeave(event: DragEvent) {
		const next = event.relatedTarget;
		if (
			next instanceof Node &&
			event.currentTarget instanceof Node &&
			event.currentTarget.contains(next)
		) {
			return;
		}
		dragOver = false;
	}

	async function onDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		const transfer = event.dataTransfer;
		const capture = readCaptureDrag(transfer);
		if (capture) {
			selectReceivedCapture(capture);
			return;
		}
		const file = transfer?.files?.[0] ?? null;
		if (!file) return;
		captureNotice = null;
		copyState = 'idle';
		const accepted = await extraction.selectFile(file);
		if (!accepted && fileInput) fileInput.value = '';
	}

	async function showReceived() {
		receivedOpen = true;
		const generation = ++receivedGeneration;
		await fetchReceived(generation, 0, false);
	}

	function loadMoreReceived() {
		if (!receivedHasMore || receivedLoading || receivedLoadingMore) return;
		void fetchReceived(receivedGeneration, receivedItems.length, true);
	}

	async function fetchReceived(generation: number, offset: number, append: boolean) {
		const token = auth.session?.access_token;
		const account = accountId;
		if (!token || !account) {
			receivedProblem = 'Entre na conta para ver os arquivos recebidos.';
			return;
		}
		if (append) receivedLoadingMore = true;
		else receivedLoading = true;
		receivedProblem = null;
		try {
			const result = await listInboxCaptures(token, {
				limit: captureLibraryPageSize,
				offset
			});
			if (generation !== receivedGeneration || accountId !== account) return;
			if (!result.data) {
				receivedProblem = receivedProblemMessage;
				return;
			}
			const incoming = result.data.items ?? [];
			receivedItems = append ? [...receivedItems, ...incoming] : incoming;
			receivedHasMore = result.data.has_more;
		} catch {
			if (generation === receivedGeneration) receivedProblem = receivedProblemMessage;
		} finally {
			if (generation === receivedGeneration) {
				receivedLoading = false;
				receivedLoadingMore = false;
			}
		}
	}

	function chooseReceived(item: InboxCapture) {
		selectReceivedCapture({
			id: item.id,
			name: item.original_filename,
			mimeType: item.mime_type
		});
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
		captureNotice = null;
		if (fileInput) fileInput.value = '';
		fileInput?.focus();
	}

	function kindLabel(mimeType: string) {
		if (mimeType === 'application/pdf') return 'PDF';
		if (mimeType === 'image/jpeg') return 'JPEG';
		if (mimeType === 'image/png') return 'PNG';
		return 'Arquivo';
	}
</script>

<svelte:head>
	<title>Extrair exames | Sonnda</title>
	<meta name="description" content="Extraia informações de exames laboratoriais." />
</svelte:head>

<section aria-labelledby="exams-title">
	<div>
		<p class="text-sm font-semibold text-brand">Ferramentas</p>
		<h1 id="exams-title" class="mt-2 text-3xl font-semibold tracking-tight">Extrair exames</h1>
	</div>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
		Extraia informações de um exame laboratorial sem vinculá-lo a um paciente.
	</p>

	<Alert variant="info" class="mt-6 max-w-3xl">
		Esta operação é independente de paciente. O arquivo e o resultado não são salvos pelo Sonnda.
	</Alert>

	<div
		class="mt-8 grid min-w-0 items-start gap-6 @min-[56rem]/workspace:grid-cols-[20rem_minmax(0,1fr)]"
	>
		<Card
			class="w-full max-w-md min-w-0 @min-[56rem]/workspace:sticky @min-[56rem]/workspace:top-6"
		>
			<form
				aria-labelledby="exam-upload-title"
				onsubmit={handleSubmit}
				ondragover={onDragOver}
				ondragleave={onDragLeave}
				ondrop={onDrop}
				novalidate
				class={['rounded-xl', dragOver && 'outline-2 outline-offset-4 outline-brand']}
			>
				<p class="text-sm font-semibold text-brand">Arquivo temporário</p>
				<h2 id="exam-upload-title" class="mt-2 text-lg font-semibold">Enviar arquivo</h2>
				<p class="mt-2 text-sm leading-6 text-on-surface-muted">
					Selecione um exame no computador ou arraste um arquivo recebido em Capturas. A extração
					começa ao clicar em Extrair dados.
				</p>

				<label for="exam-file" class="mt-6 block text-sm font-medium text-on-surface">
					Documento laboratorial <span class="text-danger" aria-hidden="true">*</span>
				</label>
				<input
					bind:this={fileInput}
					id="exam-file"
					name="file"
					type="file"
					accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
					required={!extraction.capture}
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
						PDF, JPEG ou PNG com até 10 MB. O conteúdo será verificado antes do envio.
					</p>
				{/if}

				{#if captureNotice}
					<Alert variant="warning" class="mt-4">{captureNotice}</Alert>
				{/if}

				{#if extraction.file}
					<div class="mt-4 rounded-xl border border-border bg-surface-muted p-3 text-sm">
						<p class="truncate font-medium">{extraction.file.name}</p>
						<p class="mt-1 text-on-surface-muted">{formatFileSize(extraction.file.size)}</p>
					</div>
				{:else if extraction.capture}
					<div class="mt-4 rounded-xl border border-border bg-surface-muted p-3 text-sm">
						<p class="truncate font-medium">{extraction.capture.original_filename}</p>
						<p class="mt-1 text-on-surface-muted">Recebido pelo celular. Pronto para extrair.</p>
					</div>
				{/if}

				<div class="mt-6 border-t border-border pt-6">
					<h3 id="received-captures-title" class="text-sm font-semibold">Arquivos recebidos</h3>
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						Escolha um PDF, JPEG ou PNG já enviado pelo celular.
					</p>
					{#if !receivedOpen}
						<Button variant="secondary" class="mt-4 w-full" onclick={showReceived}>
							Ver arquivos recebidos
						</Button>
					{:else if receivedLoading && receivedItems.length === 0}
						<p class="mt-4 text-sm text-on-surface-muted" role="status">Carregando arquivos...</p>
					{:else}
						{#if receivedProblem}
							<Alert variant="error" class="mt-4">{receivedProblem}</Alert>
						{/if}
						{#if receivedItems.length === 0 && !receivedProblem}
							<p class="mt-4 text-sm leading-6 text-on-surface-muted">
								Nenhum arquivo recebido nesta conta.
							</p>
						{:else}
							<ul class="mt-4 space-y-2" aria-labelledby="received-captures-title">
								{#each receivedItems as item (item.id)}
									<li>
										<button
											type="button"
											class="w-full rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
											aria-pressed={extraction.capture?.id === item.id}
											onclick={() => chooseReceived(item)}
										>
											<span class="block truncate font-medium">{item.original_filename}</span>
											<span class="mt-1 block text-on-surface-muted">
												{kindLabel(item.mime_type)} · {formatFileSize(item.size_bytes)}
											</span>
										</button>
									</li>
								{/each}
							</ul>
						{/if}
						{#if receivedHasMore}
							<Button
								variant="secondary"
								class="mt-4 w-full"
								loading={receivedLoadingMore}
								onclick={loadMoreReceived}
							>
								Carregar mais
							</Button>
						{/if}
					{/if}
				</div>

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

		<Card class="min-h-96 min-w-0">
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
