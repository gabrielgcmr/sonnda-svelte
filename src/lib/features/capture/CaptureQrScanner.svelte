<!-- src/lib/features/capture/CaptureQrScanner.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { captureCodeFromQr } from './captureQr.js';

	type Props = {
		onCode: (code: string) => void;
		onCancel: () => void;
	};

	let { onCode, onCancel }: Props = $props();
	let video: HTMLVideoElement;
	let issue = $state<string | null>(null);
	let ready = $state(false);
	let accepted = false;
	let disposed = false;

	async function onQrPhotoChange(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement) || !input.files?.[0] || accepted) return;
		try {
			const { default: QrScanner } = await import('qr-scanner');
			const result = await QrScanner.scanImage(input.files[0], { returnDetailedScanResult: true });
			if (disposed || accepted) return;
			const code = captureCodeFromQr(result.data, location.origin);
			if (!code) {
				issue =
					'Esta imagem não contém um QR de captura do Sonnda. Tente fotografar o QR exibido no computador.';
				return;
			}
			accepted = true;
			onCode(code);
		} catch {
			if (!disposed)
				issue = 'Não foi possível ler o QR nesta imagem. Tente fotografá-lo novamente.';
		} finally {
			input.value = '';
		}
	}

	onMount(() => {
		let scanner: import('qr-scanner').default | null = null;

		async function start() {
			if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
				issue =
					'A leitura contínua pela câmera exige HTTPS. Use a opção de fotografar o QR abaixo.';
				return;
			}

			try {
				const { default: QrScanner } = await import('qr-scanner');
				if (disposed) return;
				scanner = new QrScanner(
					video,
					(result) => {
						if (accepted || disposed) return;
						const code = captureCodeFromQr(result.data, location.origin);
						if (!code) {
							issue =
								'Este QR não é de uma captura do Sonnda. Aponte para o QR exibido no computador.';
							return;
						}
						accepted = true;
						scanner?.stop();
						onCode(code);
					},
					{ preferredCamera: 'environment', returnDetailedScanResult: true }
				);
				await scanner.start();
				if (disposed) return;
				ready = true;
				issue = null;
			} catch {
				if (!disposed)
					issue =
						'Não foi possível abrir a câmera. Verifique a permissão do navegador e tente novamente.';
			}
		}

		void start();
		return () => {
			disposed = true;
			scanner?.destroy();
		};
	});
</script>

<div class="mt-4 space-y-3">
	<p class="text-sm text-on-surface-muted">
		Aponte a câmera para o novo QR exibido em Capturas no computador.
	</p>
	<video
		bind:this={video}
		class="aspect-square w-full rounded-xl border border-border bg-black object-cover"
		autoplay
		muted
		playsinline
		aria-label="Leitor de QR pela câmera"
	></video>
	{#if !ready && !issue}<p role="status" class="text-sm text-on-surface-muted">
			Abrindo câmera...
		</p>{/if}
	{#if issue}<Alert variant="warning">{issue}</Alert>{/if}
	<label for="capture-qr-photo" class="block text-sm font-medium"
		>Se a câmera do navegador não abrir, fotografe o QR:</label
	>
	<input
		id="capture-qr-photo"
		type="file"
		accept="image/*"
		capture="environment"
		onchange={onQrPhotoChange}
		class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-container file:px-3 file:py-2 file:font-semibold file:text-on-brand-container"
	/>
	<Button variant="secondary" class="w-full" onclick={onCancel}>Fechar câmera</Button>
</div>
