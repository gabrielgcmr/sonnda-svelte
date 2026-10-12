<!-- src/routes/capture/+page.svelte -->
<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { CapturePresence } from '#lib/features/capture/capturePresence.svelte.js';
	import CaptureQrScanner from '#lib/features/capture/CaptureQrScanner.svelte';
	import { captureFileIssueMessage } from '#lib/features/capture/captureFile.js';
	import { CaptureSession } from '#lib/features/capture/captureSession.svelte.js';
	import { CaptureUpload } from '#lib/features/capture/captureUpload.svelte.js';
	import {
		captureCredentialStorageKey,
		captureLinkMode
	} from '#lib/features/capture/storedCredential.js';
	import Alert from '#lib/ui/Alert.svelte';
	import AuthShell from '#lib/ui/AuthShell.svelte';
	import Button from '#lib/ui/Button.svelte';

	const session = new CaptureSession();
	const presence = new CapturePresence();
	const upload = new CaptureUpload();
	const code = $derived(page.url.searchParams.get('code') ?? '');
	let storageChecked = $state(false);
	let scannerOpen = $state(false);
	let wasPaired = $state(false);
	const mode = $derived(
		captureLinkMode({
			code,
			storageChecked,
			hasCredential: session.credential !== null,
			claimStatus: session.status
		})
	);

	function removeCodeFromUrl() {
		const url = new URL(page.url.href);
		url.searchParams.delete('code');
		return goto(`${url.pathname}${url.search}${url.hash}`, { replace: true, reset: false });
	}

	function endCaptureSession() {
		wasPaired = true;
		session.invalidate(sessionStorage);
		presence.stop();
	}

	function watchCredential() {
		if (session.status === 'ready' && session.credential) {
			presence.arm(
				session.credential,
				sessionStorage,
				document.visibilityState === 'visible',
				endCaptureSession
			);
			return;
		}
		presence.stop();
	}

	async function claimCodeFromUrl(url: { searchParams: { get(name: string): string | null } }) {
		if (!storageChecked) {
			wasPaired = sessionStorage.getItem(captureCredentialStorageKey) !== null;
			session.restore(sessionStorage);
			storageChecked = true;
		}
		const nextCode = url.searchParams.get('code') ?? '';
		if (nextCode.trim() !== '') {
			await session.claim(nextCode, sessionStorage, removeCodeFromUrl);
		}
		if (session.credential) wasPaired = true;
		watchCredential();
	}

	function onVisibilityChange() {
		presence.setVisible(document.visibilityState === 'visible');
	}

	function onFileChange(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;
		void upload.select(input.files?.[0] ?? null);
	}

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!session.credential) return;
		void upload.submit({
			desktopPresent: presence.desktopPresent,
			uploadToken: session.credential.uploadToken,
			probe: () => presence.probe()
		});
	}

	async function claimScannedCode(pairingCode: string) {
		scannerOpen = false;
		await session.claim(pairingCode, sessionStorage, removeCodeFromUrl);
		if (session.credential) wasPaired = true;
		watchCredential();
	}

	onMount(() => {
		void claimCodeFromUrl(page.url);
		return () => presence.stop();
	});

	afterNavigate((navigation) => {
		if (!navigation.to) return;
		void claimCodeFromUrl(navigation.to.url);
	});
</script>

<svelte:document onvisibilitychange={onVisibilityChange} />

<svelte:head>
	<title>Enviar exame | Sonnda</title>
	<meta
		name="description"
		content="Envie o PDF ou a imagem do exame a partir do celular, sem entrar na conta."
	/>
</svelte:head>

<AuthShell
	titleId="capture-title"
	asideTitle="Envie o exame pelo celular, sem digitar no computador."
	asideDescription="Abra o QR mostrado no Sonnda. O PDF ou a imagem segue para o computador e você não precisa entrar na conta."
	eyebrow="Captura"
	title={mode === 'needs-qr' ? 'Conectar celular' : 'Enviar exame'}
	description="Esta página recebe um PDF ou uma imagem a partir do QR do computador."
>
	{#if mode === 'checking' || mode === 'claiming'}
		<p role="status">
			{mode === 'checking' ? 'Verificando o link neste celular...' : 'Conectando este celular...'}
		</p>
	{:else if mode === 'needs-qr'}
		<Alert variant="warning">
			{#if session.status === 'error' && !presence.ended && session.problem?.status === 401}
				Este QR expirou ou já foi usado. Gere outro em Capturas no computador e tente novamente.
			{:else if session.status === 'error' && !presence.ended}
				Não foi possível verificar o QR agora. Confira a conexão e tente novamente.
			{:else if presence.ended || wasPaired}
				A sessão deste celular terminou ou expirou. Gere um novo QR em Capturas no computador e
				leia-o aqui.
			{:else}
				Abra Capturas no computador para mostrar o QR e conectar este celular.
			{/if}
		</Alert>
		{#if scannerOpen}
			<CaptureQrScanner onCode={claimScannedCode} onCancel={() => (scannerOpen = false)} />
		{:else}
			<Button class="mt-4 w-full" onclick={() => (scannerOpen = true)}>
				<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
					<path
						d="M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2M4 16v2a2 2 0 0 0 2 2h2m8 0h2a2 2 0 0 0 2-2v-2"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
					/>
					<rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8" />
					<circle cx="12" cy="12" r="1.5" fill="currentColor" />
				</svg>
				Ler novo QR com a câmera
			</Button>
		{/if}
	{:else}
		{#if presence.desktopPresent === false}
			<Alert variant="warning">Abra o Sonnda no computador. Este celular continua pareado.</Alert>
		{:else if presence.desktopPresent === true}
			<Alert variant="info">O computador está aberto. Este celular continua pareado.</Alert>
		{:else}
			<Alert variant="info">
				Este celular já tem uma sessão de captura. Não é preciso entrar na conta.
			</Alert>
		{/if}

		<form class="mt-6" onsubmit={onSubmit}>
			<label for="capture-file" class="block text-sm font-medium">PDF ou imagem</label>
			<input
				id="capture-file"
				name="file"
				type="file"
				accept="application/pdf,image/jpeg,image/png"
				disabled={upload.status === 'uploading'}
				aria-invalid={upload.issue ? 'true' : undefined}
				aria-describedby={upload.issue ? 'capture-file-error' : 'capture-file-helper'}
				onchange={onFileChange}
				class="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-container file:px-3 file:py-2 file:font-semibold file:text-on-brand-container disabled:cursor-not-allowed"
			/>
			{#if upload.issue}
				<p id="capture-file-error" class="mt-2 text-sm text-danger">
					{captureFileIssueMessage(upload.issue)}
				</p>
			{:else}
				<p id="capture-file-helper" class="mt-2 text-sm leading-6 text-on-surface-muted">
					PDF, JPEG ou PNG com até 5 MiB. O arquivo é conferido neste celular antes do envio.
				</p>
			{/if}
			{#if upload.file}
				<p class="mt-3 truncate text-sm font-medium">{upload.file.name}</p>
			{/if}
			{#if upload.notice}
				<div class="mt-4">
					<Alert variant="warning">{upload.notice}</Alert>
				</div>
			{/if}
			{#if upload.progress !== null}
				<div class="mt-4">
					<div class="mb-2 flex justify-between text-sm">
						<span>Enviando o exame...</span>
						<span>{upload.progress}%</span>
					</div>
					<div
						class="h-2 overflow-hidden rounded-full bg-surface-muted"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={upload.progress}
						aria-label="Envio do exame"
					>
						<div class="h-full bg-brand" style:width="{upload.progress}%"></div>
					</div>
				</div>
			{/if}
			<Button
				type="submit"
				class="mt-6 w-full"
				loading={upload.status === 'uploading'}
				disabled={!upload.file || upload.issue !== null}
			>
				Enviar arquivo
			</Button>
		</form>

		{#if upload.sentNames.length > 0}
			<h3 class="mt-6 text-sm font-semibold">Enviados nesta página</h3>
			<ul class="mt-2 space-y-2 text-sm">
				{#each upload.sentNames as name, index (index)}
					<li class="truncate">{name}</li>
				{/each}
			</ul>
		{/if}
	{/if}

	{#snippet footer()}
		O envio não pede login e não usa a área autenticada do Sonnda.
	{/snippet}
</AuthShell>
