<!-- src/routes/(app)/home/exams/+page.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import {
		captureDragPresent,
		readCaptureDrag,
		type CaptureDrag
	} from '#lib/features/capture/captureDrag.js';
	import { captureSupportsStandaloneExtraction } from '#lib/features/capture/captureFile.js';
	import CapturePreviewCard from '#lib/features/capture/CapturePreviewCard.svelte';
	import TemporaryDocumentViewer from '#lib/features/documentprocessing/TemporaryDocumentViewer.svelte';
	import {
		getTemporaryExtraction,
		listTemporaryExtractions,
		retryTemporaryExtraction
	} from '#lib/features/documentprocessing/temporaryExtractionApi.js';
	import type { components } from '#lib/generated/openapi.js';
	import ImagingReportResult from '#lib/features/imagingextraction/ImagingReportResult.svelte';
	import { copyImagingSummary } from '#lib/features/imagingextraction/presentation.js';
	import { ImagingExtractionState } from '#lib/features/imagingextraction/imagingExtraction.svelte.js';
	import type { ImagingExtractionProblem } from '#lib/features/imagingextraction/types.js';
	import LabExtractionResult from '#lib/features/labextraction/LabExtractionResult.svelte';
	import { LabExtractionState } from '#lib/features/labextraction/labExtraction.svelte.js';
	import { copyExtractionSummary } from '#lib/features/labextraction/presentation.js';
	import type { LabExtractionProblem } from '#lib/features/labextraction/types.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import DocumentPreviewCard from '#lib/ui/DocumentPreviewCard.svelte';

	const unsupportedCapture = 'Use uma captura em PDF, JPEG ou PNG.';

	type ExtractionMode = 'laboratory' | 'imaging';
	type TemporaryJob = components['schemas']['TemporaryResultResponse'];

	const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	const labExtraction = new LabExtractionState();
	const imagingExtraction = new ImagingExtractionState();
	const accountId = $derived(currentAccount.account?.id ?? null);
	let mode = $state<ExtractionMode>('laboratory');
	const selectedFile = $derived(
		mode === 'laboratory' ? labExtraction.file : imagingExtraction.file
	);
	const selectedCapture = $derived(
		mode === 'laboratory' ? labExtraction.capture : imagingExtraction.capture
	);
	const selectedImagingPages = $derived(
		imagingExtraction.files.length
			? imagingExtraction.files.map((file) => ({
					name: file.name,
					size: file.size,
					mimeType: file.type,
					file,
					captureId: null,
					createdAt: undefined
				}))
			: imagingExtraction.captures.map((capture) => ({
					name: capture.original_filename,
					size: capture.size_bytes,
					mimeType: capture.mime_type,
					file: null,
					captureId: capture.id,
					createdAt: capture.created_at
				}))
	);
	const selectedLabPages = $derived(
		labExtraction.files.length
			? labExtraction.files.map((file) => ({
					name: file.name,
					size: file.size,
					mimeType: file.type,
					file,
					captureId: null,
					createdAt: undefined
				}))
			: labExtraction.captures.map((capture) => ({
					name: capture.original_filename,
					size: capture.size_bytes ?? 0,
					mimeType: capture.mime_type ?? '',
					file: null,
					captureId: capture.id,
					createdAt: capture.created_at
				}))
	);
	const selectedPages = $derived(mode === 'laboratory' ? selectedLabPages : selectedImagingPages);
	function moveSelectedPage(index: number, direction: -1 | 1) {
		if (mode === 'laboratory') labExtraction.movePage(index, direction);
		else imagingExtraction.movePage(index, direction);
	}
	function removeSelectedPage(index: number) {
		if (mode === 'laboratory') labExtraction.removePage(index);
		else imagingExtraction.removePage(index);
	}
	const fileError = $derived(
		mode === 'laboratory' ? labExtraction.fileError : imagingExtraction.fileError
	);
	const checkingFile = $derived(
		mode === 'laboratory' ? labExtraction.checkingFile : imagingExtraction.checkingFile
	);
	const extractionStatus = $derived(
		mode === 'laboratory' ? labExtraction.status : imagingExtraction.status
	);
	const extractionProblem = $derived(
		mode === 'laboratory' ? labExtraction.problem : imagingExtraction.problem
	);
	const activeTemporaryId = $derived(
		mode === 'laboratory' ? labExtraction.temporaryId : imagingExtraction.temporaryId
	);
	const extractionProgress = $derived(
		mode === 'laboratory' ? labExtraction.progress : imagingExtraction.progress
	);
	let fileInput = $state<HTMLInputElement>();
	let copyState = $state<'idle' | 'copied' | 'error'>('idle');
	let captureNotice = $state<string | null>(null);
	let dragOver = $state(false);
	let savedItems = $state<TemporaryJob[]>([]);
	let savedLoading = $state(false);
	let savedError = $state<string | null>(null);
	let openingSavedId = $state<string | null>(null);
	let savedRequestVersion = 0;
	let job = $state.raw<TemporaryJob | null>(null);
	let reviewTab = $state<'document' | 'result'>('result');
	const openJob = $derived(job && job.id === activeTemporaryId ? job : null);

	$effect(() => {
		const labAccountChanged = labExtraction.bindAccount(accountId);
		const imagingAccountChanged = imagingExtraction.bindAccount(accountId);
		if (!labAccountChanged && !imagingAccountChanged) return;
		if (fileInput) fileInput.value = '';
		copyState = 'idle';
		captureNotice = null;
		job = null;
		reviewTab = 'result';
	});
	$effect(() => {
		const id = activeTemporaryId;
		const account = accountId;
		const token = auth.session?.access_token;
		if (!id || !account || !token || extractionStatus !== 'processing') return;
		let stopped = false;
		const poll = async () => {
			try {
				const { data, error } = await getTemporaryExtraction(token, id);
				if (stopped || accountId !== account || activeTemporaryId !== id) return;
				if (error?.status === 404) {
					if (mode === 'laboratory') labExtraction.startOver();
					else imagingExtraction.startOver();
					savedError = 'Este trabalho expirou ou não está mais disponível.';
					void refreshSaved(token, account);
					return;
				}
				if (!data) return;
				job = data;
				if (data.status === 'completed' || data.status === 'failed') {
					await openSaved(id, token, account);
					void refreshSaved(token, account);
				} else if (mode === 'laboratory') labExtraction.progress = data.progress;
				else imagingExtraction.progress = data.progress;
			} catch {
				// A falha de rede não encerra o trabalho no servidor.
			}
		};
		const timer = setInterval(() => void poll(), 3000);
		void poll();
		return () => {
			stopped = true;
			clearInterval(timer);
		};
	});
	$effect(() => {
		const id = accountId;
		const token = auth.session?.access_token;
		const version = ++savedRequestVersion;
		savedItems = [];
		savedError = null;
		if (!id || !token) return;
		savedLoading = true;
		void listTemporaryExtractions(token)
			.then(async ({ data, error }) => {
				if (version !== savedRequestVersion || accountId !== id) return;
				if (error || !data) {
					savedError = 'Não foi possível consultar as extrações anteriores.';
					return;
				}
				savedItems = data.items ?? [];
				if (savedItems[0] && extractionStatus === 'idle' && !selectedFile && !selectedCapture) {
					await openSaved(savedItems[0].id, token, id);
				}
			})
			.catch(() => {
				if (version === savedRequestVersion)
					savedError = 'Não foi possível consultar as extrações anteriores.';
			})
			.finally(() => {
				if (version === savedRequestVersion) savedLoading = false;
			});
		return () => {
			savedRequestVersion += 1;
		};
	});

	async function refreshSaved(token: string, id: string) {
		try {
			const { data } = await listTemporaryExtractions(token);
			if (accountId === id && data) savedItems = data.items ?? [];
		} catch {
			if (accountId === id) savedError = 'Não foi possível atualizar as extrações recentes.';
		}
	}

	async function openSaved(id: string, token = auth.session?.access_token, account = accountId) {
		if (!token || !account) return;
		openingSavedId = id;
		try {
			const { data, error } = await getTemporaryExtraction(token, id);
			if (accountId !== account || auth.session?.access_token !== token) return;
			if (error || !data) {
				savedError = 'Este resultado não está mais disponível.';
				void refreshSaved(token, account);
				return;
			}
			labExtraction.startOver();
			imagingExtraction.startOver();
			if (job?.id !== data.id) reviewTab = 'result';
			job = data;
			mode = data.kind === 'imaging' ? 'imaging' : 'laboratory';
			if (data.lab_result) labExtraction.restore(data.lab_result, data.id);
			if (data.imaging_result) imagingExtraction.restore(data.imaging_result, data.id);
			if (data.status === 'queued' || data.status === 'processing') {
				if (data.kind === 'laboratory') labExtraction.restorePending(data.id, data.progress);
				else imagingExtraction.restorePending(data.id, data.progress);
			}
			if (data.status === 'failed') {
				const message = data.error_message || 'Não foi possível concluir a extração.';
				if (data.kind === 'laboratory') labExtraction.restoreFailure(data.id, message);
				else imagingExtraction.restoreFailure(data.id, message);
			}
			copyState = 'idle';
			savedError = null;
		} catch {
			if (accountId === account) savedError = 'Não foi possível abrir este resultado.';
		} finally {
			if (openingSavedId === id) openingSavedId = null;
		}
	}
	onDestroy(() => {
		labExtraction.clear();
		imagingExtraction.clear();
	});

	function formatDateTime(value: string) {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? '' : dateTimeFormat.format(date);
	}

	function savedTitle(item: TemporaryJob) {
		if (item.patient_name) return item.patient_name;
		if (item.exam_name) return item.exam_name;
		if (item.status === 'queued' || item.status === 'processing') return 'Processando...';
		if (item.status === 'failed') return 'Extração com falha';
		return 'Paciente não identificado';
	}

	function savedStatus(item: TemporaryJob) {
		if (item.status === 'queued') return 'Na fila';
		if (item.status === 'processing') return `Processando (${item.progress}%)`;
		if (item.status === 'failed') return 'Falhou';
		return null;
	}

	function problemMessage(problem: LabExtractionProblem | ImagingExtractionProblem) {
		if (problem.status === 413)
			return mode === 'laboratory'
				? 'Selecione até 20 imagens com no máximo 10 MB cada.'
				: 'O arquivo ultrapassa o limite de 10 MB.';
		if (problem.status === 415) return 'A API aceita arquivos PDF, JPEG ou PNG válidos.';
		return problem.detail || problem.title || 'Não foi possível extrair os dados do exame.';
	}

	function selectMode(nextMode: ExtractionMode) {
		if (mode === nextMode) return;
		labExtraction.startOver();
		imagingExtraction.startOver();
		mode = nextMode;
		copyState = 'idle';
		captureNotice = null;
		dragOver = false;
		if (fileInput) fileInput.value = '';
	}

	function selectReceivedCapture(capture: CaptureDrag) {
		if (!captureSupportsStandaloneExtraction(capture.mimeType)) {
			captureNotice = unsupportedCapture;
			return;
		}
		captureNotice = null;
		if (fileInput) fileInput.value = '';
		const selected = {
			id: capture.id,
			original_filename: capture.name,
			mime_type: capture.mimeType,
			size_bytes: capture.sizeBytes,
			created_at: capture.createdAt
		};
		if (mode === 'laboratory') labExtraction.selectCapture(selected);
		else imagingExtraction.selectCapture(selected);
	}

	async function handleFileChange(event: Event) {
		copyState = 'idle';
		captureNotice = null;
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (mode === 'laboratory') await labExtraction.selectFiles(files, true);
		else await imagingExtraction.selectFiles(files);
		input.value = '';
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
		const files = Array.from(transfer?.files ?? []);
		if (!files.length) return;
		captureNotice = null;
		copyState = 'idle';
		const accepted =
			mode === 'laboratory'
				? await labExtraction.selectFiles(files, true)
				: await imagingExtraction.selectFiles(files);
		if (!accepted && fileInput) fileInput.value = '';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		await runExtraction();
	}

	async function runExtraction() {
		const accessToken = auth.session?.access_token;
		const activeExtraction = mode === 'laboratory' ? labExtraction : imagingExtraction;
		if (!activeExtraction.requireFile()) {
			fileInput?.focus();
			return;
		}
		if (!accessToken || !accountId || extractionStatus === 'processing') return;
		copyState = 'idle';
		const completed = await activeExtraction.extract(accessToken, accountId);
		if (completed) void refreshSaved(accessToken, accountId);
	}

	async function retryExtraction() {
		const id = activeTemporaryId;
		const token = auth.session?.access_token;
		const account = accountId;
		if (!id || !token || !account) {
			await runExtraction();
			return;
		}
		try {
			const { data, error } = await retryTemporaryExtraction(token, id);
			if (accountId !== account || activeTemporaryId !== id) return;
			if (error || !data) {
				savedError = 'Não foi possível tentar novamente este trabalho.';
				return;
			}
			if (mode === 'laboratory') labExtraction.restorePending(id, 0);
			else imagingExtraction.restorePending(id, 0);
			void refreshSaved(token, account);
		} catch {
			if (accountId === account) savedError = 'Não foi possível conectar à API.';
		}
	}

	async function copySummary() {
		const copyMode = mode;
		const summary =
			mode === 'laboratory'
				? (labExtraction.result?.summary_text ?? '')
				: (imagingExtraction.result?.summary_text ?? '');
		const clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard;
		const copied =
			mode === 'laboratory'
				? await copyExtractionSummary(summary, clipboard)
				: await copyImagingSummary(summary, clipboard);
		if (mode === copyMode) copyState = copied ? 'copied' : 'error';
	}

	function startOver() {
		if (mode === 'laboratory') labExtraction.startOver();
		else imagingExtraction.startOver();
		copyState = 'idle';
		captureNotice = null;
		if (fileInput) fileInput.value = '';
		fileInput?.focus();
	}
</script>

<svelte:head>
	<title
		>{mode === 'laboratory' ? 'Extrair exames laboratoriais' : 'Extrair laudo de imagem'} | Sonnda</title
	>
	<meta
		name="description"
		content={mode === 'laboratory'
			? 'Extraia informações de exames laboratoriais.'
			: 'Extraia informações de laudos escritos de exames de imagem.'}
	/>
</svelte:head>

<section aria-labelledby="exams-title">
	<h1 id="exams-title" class="text-3xl font-semibold tracking-tight">Extrair exames</h1>
	<div
		class="mt-6 inline-flex rounded-xl border border-border bg-surface-muted p-1"
		role="group"
		aria-label="Tipo de extração"
	>
		<button
			type="button"
			aria-pressed={mode === 'laboratory'}
			class={mode === 'laboratory'
				? 'rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-on-surface shadow-sm'
				: 'rounded-lg px-4 py-2 text-sm font-medium text-on-surface-muted hover:text-on-surface'}
			onclick={() => selectMode('laboratory')}
		>
			Exame laboratorial
		</button>
		<button
			type="button"
			aria-pressed={mode === 'imaging'}
			class={mode === 'imaging'
				? 'rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-on-surface shadow-sm'
				: 'rounded-lg px-4 py-2 text-sm font-medium text-on-surface-muted hover:text-on-surface'}
			onclick={() => selectMode('imaging')}
		>
			Exame de imagem
		</button>
	</div>
	<p class="mt-3 max-w-4xl leading-7 text-on-surface-muted">
		{mode === 'laboratory'
			? 'Extraia informações de um exame laboratorial sem vinculá-lo a um paciente.'
			: 'Extraia informações de um laudo escrito de ultrassom, tomografia, ressonância ou mamografia.'}
		O arquivo e o resultado ficam disponíveis por até 24 horas e não são salvos no prontuário.
	</p>

	<div
		class="mt-8 grid min-w-0 items-start gap-6 @min-[56rem]/workspace:grid-cols-[22rem_minmax(0,1fr)]"
	>
		<div class="flex w-full max-w-md min-w-0 flex-col gap-6">
			<Card class="min-w-0">
				<form
					aria-labelledby="exam-upload-title"
					onsubmit={handleSubmit}
					ondragover={onDragOver}
					ondragleave={onDragLeave}
					ondrop={onDrop}
					novalidate
				>
					<p class="text-sm font-semibold text-brand">Arquivo temporário</p>
					<h2 id="exam-upload-title" class="mt-2 text-lg font-semibold">
						{mode === 'laboratory' ? 'Enviar exame laboratorial' : 'Enviar laudo de imagem'}
					</h2>
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						Arraste o arquivo para a área abaixo ou clique nela para escolher. A extração começa ao
						clicar em Extrair dados.
					</p>

					<label
						class={[
							'mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand',
							dragOver
								? 'border-brand bg-brand-container text-on-brand-container'
								: 'border-brand/40 bg-canvas text-on-surface hover:border-brand hover:bg-brand-container/40',
							(extractionStatus === 'processing' || checkingFile) && 'cursor-not-allowed opacity-60'
						]}
					>
						<input
							bind:this={fileInput}
							id="exam-file"
							name="file"
							type="file"
							accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
							multiple
							required={!selectedCapture && !selectedFile}
							disabled={extractionStatus === 'processing' || checkingFile}
							aria-invalid={fileError ? 'true' : undefined}
							aria-describedby={fileError ? 'exam-file-error' : 'exam-file-helper'}
							onchange={handleFileChange}
							class="sr-only"
						/>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							class={['size-10', dragOver ? 'text-on-brand-container' : 'text-brand']}
							aria-hidden="true"
						>
							<path
								d="M12 16V5m0 0 4 4m-4-4-4 4M5 19h14"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<p class="mt-4 text-base font-semibold">
							{dragOver
								? 'Solte para selecionar'
								: mode === 'imaging'
									? 'Arraste o laudo para cá'
									: 'Arraste o exame para cá'}
						</p>
						<p
							class={[
								'mt-1 text-sm leading-6',
								dragOver ? 'text-on-brand-container' : 'text-on-surface-muted'
							]}
						>
							ou clique para escolher um arquivo
						</p>
					</label>
					{#if fileError}
						<p id="exam-file-error" class="mt-2 text-sm text-danger">{fileError}</p>
					{:else}
						<p id="exam-file-helper" class="mt-2 text-sm leading-6 text-on-surface-muted">
							{mode === 'imaging'
								? 'Um PDF ou até 5 imagens JPEG/PNG do mesmo laudo, com até 10 MB no total. Também aceita um arquivo arrastado de Capturas.'
								: 'Um PDF ou até 20 imagens JPEG/PNG do mesmo exame, com até 10 MB por imagem. Também aceita capturas arrastadas.'}
						</p>
					{/if}

					{#if captureNotice}
						<Alert variant="warning" class="mt-4">{captureNotice}</Alert>
					{/if}

					{#if selectedPages.length}
						<ol class="mt-4 space-y-2" aria-label="Páginas selecionadas em ordem">
							{#each selectedPages as page, index (`${page.name}-${index}`)}
								<li>
									{#snippet actions()}
										<div class="flex shrink-0 gap-1 text-sm">
											<button
												type="button"
												class="rounded px-1 hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
												aria-label={`Mover ${page.name} para cima`}
												disabled={index === 0 || extractionStatus === 'processing'}
												onclick={() => moveSelectedPage(index, -1)}>↑</button
											>
											<button
												type="button"
												class="rounded px-1 hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
												aria-label={`Mover ${page.name} para baixo`}
												disabled={index === selectedPages.length - 1 ||
													extractionStatus === 'processing'}
												onclick={() => moveSelectedPage(index, 1)}>↓</button
											>
											<button
												type="button"
												class="rounded px-1 text-danger hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
												aria-label={`Remover ${page.name}`}
												disabled={extractionStatus === 'processing'}
												onclick={() => removeSelectedPage(index)}>Remover</button
											>
										</div>
									{/snippet}
									{#if page.captureId}
										<CapturePreviewCard
											captureId={page.captureId}
											name={`${index + 1}. ${page.name}`}
											mimeType={page.mimeType}
											sizeBytes={page.size}
											createdAt={page.createdAt}
											accessToken={auth.session?.access_token ?? null}
											{actions}
										/>
									{:else}
										<DocumentPreviewCard
											name={`${index + 1}. ${page.name}`}
											mimeType={page.mimeType}
											sizeBytes={page.size}
											file={page.file}
											{actions}
										/>
									{/if}
								</li>
							{/each}
						</ol>
					{:else if selectedFile}
						<DocumentPreviewCard
							name={selectedFile.name}
							mimeType={selectedFile.type}
							sizeBytes={selectedFile.size}
							file={selectedFile}
							class="mt-4"
						/>
					{:else if selectedCapture}
						<div class="mt-4">
							<CapturePreviewCard
								captureId={selectedCapture.id}
								name={selectedCapture.original_filename}
								mimeType={selectedCapture.mime_type ?? ''}
								sizeBytes={selectedCapture.size_bytes}
								createdAt={selectedCapture.created_at}
								accessToken={auth.session?.access_token ?? null}
							/>
							<p class="mt-1 text-sm text-on-surface-muted">
								Recebido pelo celular. Pronto para extrair.
							</p>
						</div>
					{/if}

					<Button
						type="submit"
						class="mt-6 w-full"
						loading={extractionStatus === 'processing'}
						disabled={checkingFile}
					>
						{extractionStatus === 'processing' ? 'Extraindo...' : 'Extrair dados'}
					</Button>
				</form>
			</Card>

			{#if savedLoading || savedError || savedItems.length}
				<Card class="min-w-0">
					<h2 class="text-base font-semibold">Extrações recentes</h2>
					{#if savedLoading}
						<p class="mt-2 text-sm text-on-surface-muted">Carregando resultados anteriores...</p>
					{/if}
					{#if savedError}<Alert variant="warning" class="mt-3">{savedError}</Alert>{/if}
					{#if savedItems.length}
						<ul class="mt-3 max-h-96 space-y-1 overflow-y-auto">
							{#each savedItems as item (item.id)}
								{@const status = savedStatus(item)}
								<li>
									<button
										type="button"
										class={[
											'flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand',
											item.id === activeTemporaryId && 'bg-surface-muted'
										]}
										aria-current={item.id === activeTemporaryId ? 'true' : undefined}
										aria-busy={openingSavedId === item.id || undefined}
										onclick={() => openSaved(item.id)}
									>
										<span
											class="w-14 shrink-0 rounded-md bg-brand-container px-1.5 py-0.5 text-center text-xs font-semibold text-on-brand-container"
										>
											{item.kind === 'imaging' ? 'Imagem' : 'Lab'}
										</span>
										<span class="min-w-0 flex-1">
											<span class="block truncate text-sm font-medium" title={savedTitle(item)}
												>{savedTitle(item)}</span
											>
											<span class="block text-xs text-on-surface-muted">
												{status ? `${status} · ` : ''}<time datetime={item.created_at}
													>{formatDateTime(item.created_at)}</time
												>
											</span>
										</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</Card>
			{/if}
		</div>

		<Card class="@container/review min-h-96 min-w-0">
			{#if openJob}
				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="text-sm text-on-surface-muted">
						Disponível até <time datetime={openJob.expires_at}
							>{formatDateTime(openJob.expires_at)}</time
						>
					</p>
					<div
						class="inline-flex rounded-xl border border-border bg-surface-muted p-1 @min-[52rem]/review:hidden"
						role="group"
						aria-label="Área exibida"
					>
						{#each [{ id: 'result', label: 'Resultado' }, { id: 'document', label: 'Documento' }] as const as tab (tab.id)}
							<button
								type="button"
								aria-pressed={reviewTab === tab.id}
								class={reviewTab === tab.id
									? 'rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-on-surface shadow-sm'
									: 'rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-muted hover:text-on-surface'}
								onclick={() => (reviewTab = tab.id)}
							>
								{tab.label}
							</button>
						{/each}
					</div>
				</div>
				<Alert variant="warning" class="mt-4">
					Dados extraídos automaticamente. Confira com o documento original antes de qualquer uso
					clínico.
				</Alert>
				<div class="mt-5 grid min-w-0 items-start gap-6 @min-[52rem]/review:grid-cols-2">
					<div
						class={[
							'min-w-0 @min-[52rem]/review:sticky @min-[52rem]/review:top-6 @min-[52rem]/review:block',
							reviewTab !== 'document' && 'hidden'
						]}
					>
						{#key openJob.id}
							<TemporaryDocumentViewer
								extractionId={openJob.id}
								pages={openJob.pages ?? []}
								accessToken={auth.session?.access_token ?? null}
							/>
						{/key}
					</div>
					<div class={['min-w-0 @min-[52rem]/review:block', reviewTab !== 'result' && 'hidden']}>
						{@render resultPane()}
					</div>
				</div>
			{:else}
				{@render resultPane()}
			{/if}
		</Card>
	</div>
</section>

{#snippet resultPane()}
	{#if extractionStatus === 'processing'}
		<div class="grid min-h-80 place-items-center text-center" aria-live="polite" aria-busy="true">
			<div class="max-w-sm">
				<span
					class="mx-auto block size-10 animate-spin rounded-full border-4 border-brand/25 border-t-brand"
					aria-hidden="true"
				></span>
				<h2 class="mt-5 text-lg font-semibold">
					{mode === 'laboratory' ? 'Processando o exame' : 'Processando o laudo de imagem'}
				</h2>
				<p class="mt-2 text-sm leading-6 text-on-surface-muted">
					{extractionProgress > 0
						? `Processando (${extractionProgress}%).`
						: 'Aguardando processamento.'} Você pode sair desta página e voltar depois.
				</p>
			</div>
		</div>
	{:else if mode === 'laboratory' && labExtraction.result}
		<LabExtractionResult
			result={labExtraction.result}
			{copyState}
			onCopy={copySummary}
			onStartOver={startOver}
		/>
	{:else if mode === 'imaging' && imagingExtraction.result}
		<ImagingReportResult
			result={imagingExtraction.result}
			{copyState}
			onCopy={copySummary}
			onStartOver={startOver}
		/>
	{:else if extractionStatus === 'error'}
		<div aria-live="polite">
			<p class="text-sm font-semibold text-brand">Resultado</p>
			<h2 class="mt-2 text-lg font-semibold">Não foi possível concluir a extração</h2>
			{#if extractionProblem}
				<Alert variant="error" class="mt-5">{problemMessage(extractionProblem)}</Alert>
			{/if}
			<p class="mt-4 text-sm leading-6 text-on-surface-muted">
				O trabalho e seus arquivos continuam disponíveis até o prazo de expiração.
			</p>
			<Button variant="secondary" class="mt-5" onclick={retryExtraction}>Tentar novamente</Button>
		</div>
	{:else}
		<div class="grid min-h-80 place-items-center text-center" aria-live="polite">
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
				<p class="mt-4 font-medium">
					{mode === 'laboratory' ? 'Nenhum exame enviado' : 'Nenhum laudo enviado'}
				</p>
				<p class="mt-2 text-sm leading-6 text-on-surface-muted">
					O resumo temporário será apresentado aqui após o processamento.
				</p>
			</div>
		</div>
	{/if}
{/snippet}
