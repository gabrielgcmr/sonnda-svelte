<!-- src/lib/features/capture/CaptureInboxPanel.svelte -->
<script lang="ts">
	import QRCode from 'qrcode';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import type { CaptureLibrary } from './captureLibrary.svelte.js';
	import CaptureInboxItem from './CaptureInboxItem.svelte';
	import { capturePairingUrl } from './desktopCaptureApi.js';
	import type { DesktopCaptureConnection } from './desktopCapture.svelte.js';

	type Props = {
		connection: DesktopCaptureConnection;
		library: CaptureLibrary;
	};

	let { connection, library }: Props = $props();

	const pairingUrl = $derived(
		connection.pairingCode
			? capturePairingUrl(globalThis.location?.origin ?? '', connection.pairingCode)
			: null
	);
	const drawQr = $derived.by(() => {
		const url = pairingUrl;
		return (node: HTMLCanvasElement) => {
			if (!url) return;
			void QRCode.toCanvas(node, url, { width: 220, margin: 1 });
		};
	});
</script>

<div id="capture-inbox-panel" aria-labelledby="capture-inbox-title">
	<h2 id="capture-inbox-title" class="text-sm font-semibold">Enviar pelo celular</h2>

	<div class="mt-3 space-y-4">
		{#if connection.phase === 'loading'}
			<p role="status">Preparando a conexão...</p>
		{:else if connection.mobilePresent}
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
		{:else if connection.claimed}
			<Alert variant="warning">
				Sem atividade recente do celular. Ele pode continuar pareado; abra a página de captura no
				celular para verificar. Os arquivos já recebidos continuam disponíveis.
			</Alert>
			<Button variant="secondary" class="w-full" onclick={() => connection.renewPairing()}>
				Gerar novo QR e substituir conexão
			</Button>
		{/if}

		{#if connection.problem}
			<Alert variant="error">{connection.problem}</Alert>
		{/if}

		<section aria-labelledby="capture-inbox-files">
			<h3 id="capture-inbox-files" class="text-sm font-semibold">Arquivos recebidos</h3>
			{#if library.loading && library.items.length === 0}
				<p class="mt-2 text-sm text-on-surface-muted" role="status">Carregando arquivos...</p>
			{:else if library.items.length === 0}
				{#if library.problem}
					<Alert variant="error" class="mt-3">{library.problem}</Alert>
				{:else}
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						Nenhum PDF ou imagem disponível nesta conta.
					</p>
				{/if}
			{:else}
				<p class="mt-1 text-sm leading-6 text-on-surface-muted">
					Arraste um arquivo até a ferramenta que vai usá-lo.
				</p>
				{#if library.problem}
					<Alert variant="error" class="mt-3">{library.problem}</Alert>
				{/if}
				<ul class="mt-3 space-y-3">
					{#each library.items as item (item.id)}
						<CaptureInboxItem {item} accessToken={auth.session?.access_token ?? null} />
					{/each}
				</ul>
				{#if library.hasMore}
					<Button
						variant="secondary"
						class="mt-4 w-full"
						loading={library.loadingMore}
						onclick={() => library.loadMore()}
					>
						Carregar mais
					</Button>
				{/if}
			{/if}
		</section>
	</div>

	{#if connection.sessionId}
		<Button
			variant="ghost"
			class="mt-4 w-full"
			loading={connection.ending}
			onclick={() => connection.end({ reopen: true })}
		>
			Encerrar conexão
		</Button>
	{/if}
</div>
