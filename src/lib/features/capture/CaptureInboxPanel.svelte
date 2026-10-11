<!-- src/lib/features/capture/CaptureInboxPanel.svelte -->
<script lang="ts">
	import QRCode from 'qrcode';
	import { formatFileSize } from '#lib/features/labextraction/presentation.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { capturePairingUrl } from './desktopCaptureApi.js';
	import { captureSupportsStandaloneExtraction } from './captureFile.js';
	import type { DesktopCaptureInbox, InboxCapture } from './desktopCapture.svelte.js';

	type Props = {
		inbox: DesktopCaptureInbox;
		extracting?: boolean;
		onExtract: (capture: InboxCapture) => void;
		onClose: () => void;
	};

	let { inbox, extracting = false, onExtract, onClose }: Props = $props();

	const pairingUrl = $derived(
		inbox.pairingCode
			? capturePairingUrl(globalThis.location?.origin ?? '', inbox.pairingCode)
			: null
	);
	const drawQr = $derived.by(() => {
		const url = pairingUrl;
		return (node: HTMLCanvasElement) => {
			if (!url) return;
			void QRCode.toCanvas(node, url, { width: 220, margin: 1 });
		};
	});

	function kindLabel(mimeType: string) {
		if (mimeType === 'application/pdf') return 'PDF';
		if (mimeType === 'image/jpeg') return 'JPEG';
		if (mimeType === 'image/png') return 'PNG';
		return 'Arquivo';
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<button
	type="button"
	class="fixed inset-0 z-40 bg-canvas/70"
	aria-label="Fechar captura"
	tabindex={-1}
	onclick={onClose}
></button>
<div
	id="capture-inbox-panel"
	class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-xl"
	role="dialog"
	aria-modal="true"
	aria-labelledby="capture-inbox-title"
>
	<div class="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
		<div>
			<p class="text-sm font-semibold text-brand">Captura</p>
			<h2 id="capture-inbox-title" class="mt-1 text-lg font-semibold">Enviar pelo celular</h2>
		</div>
		<Button variant="ghost" size="sm" onclick={onClose} autofocus>Fechar</Button>
	</div>

	<div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
		{#if inbox.phase === 'loading'}
			<p role="status">Preparando a conexão...</p>
		{:else if inbox.phase === 'error' && inbox.problem}
			<Alert variant="error">{inbox.problem}</Alert>
		{:else}
			{#if inbox.mobilePresent}
				<Alert variant="info">Celular conectado. Os arquivos enviados aparecem abaixo.</Alert>
			{:else if pairingUrl}
				<div class="text-center">
					<canvas
						{@attach drawQr}
						class="mx-auto rounded-xl border border-border bg-white p-2"
						aria-label="QR para conectar o celular"
					></canvas>
					<p class="mt-3 text-sm leading-6 text-on-surface-muted">
						Aponte a câmera do celular para o QR. O código vale por alguns minutos.
					</p>
				</div>
			{:else if inbox.claimed}
				<Alert variant="warning">
					O celular está desconectado. Os arquivos já recebidos continuam disponíveis.
				</Alert>
				<Button variant="secondary" class="w-full" onclick={() => inbox.renewPairing()}>
					Gerar novo QR
				</Button>
			{/if}

			{#if inbox.problem}
				<Alert variant="error">{inbox.problem}</Alert>
			{/if}

			<section aria-labelledby="capture-inbox-files">
				<h3 id="capture-inbox-files" class="text-sm font-semibold">Arquivos recebidos</h3>
				{#if inbox.captures.length === 0}
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						Nenhum PDF ou imagem disponível nesta conta.
					</p>
				{:else}
					<ul class="mt-3 space-y-3">
						{#each inbox.captures as item (item.id)}
							<li class="rounded-xl border border-border p-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{item.original_filename}</p>
										<p class="mt-1 text-sm text-on-surface-muted">
											{kindLabel(item.mime_type)} · {formatFileSize(item.size_bytes)}
										</p>
									</div>
									{#if captureSupportsStandaloneExtraction(item.mime_type)}
										<Button
											variant="secondary"
											size="sm"
											disabled={extracting}
											onclick={() => onExtract(item)}
										>
											Extrair
										</Button>
									{/if}
								</div>
								{#if !captureSupportsStandaloneExtraction(item.mime_type)}
									<p class="mt-2 text-sm leading-6 text-on-surface-muted">
										A extração de imagens ainda não está disponível.
									</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	</div>

	{#if inbox.sessionId}
		<div class="border-t border-border px-5 py-4">
			<Button
				variant="ghost"
				class="w-full"
				loading={inbox.ending}
				onclick={() => inbox.endConnection({ reopen: true })}
			>
				Encerrar conexão
			</Button>
		</div>
	{/if}
</div>
