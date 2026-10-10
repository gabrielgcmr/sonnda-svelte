<!-- src/routes/capture/+page.svelte -->
<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { CapturePresence } from '#lib/features/capture/capturePresence.svelte.js';
	import { CaptureSession } from '#lib/features/capture/captureSession.svelte.js';
	import { captureLinkMode } from '#lib/features/capture/storedCredential.js';
	import Alert from '#lib/ui/Alert.svelte';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	const session = new CaptureSession();
	const presence = new CapturePresence();
	const code = $derived(page.url.searchParams.get('code') ?? '');
	let storageChecked = $state(false);
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
			session.restore(sessionStorage);
			storageChecked = true;
		}
		const nextCode = url.searchParams.get('code') ?? '';
		if (nextCode.trim() !== '') {
			await session.claim(nextCode, sessionStorage, removeCodeFromUrl);
		}
		watchCredential();
	}

	function onVisibilityChange() {
		presence.setVisible(document.visibilityState === 'visible');
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
		content="Envie o PDF do exame a partir do celular, sem entrar na conta."
	/>
</svelte:head>

<AuthShell
	titleId="capture-title"
	asideTitle="Envie o exame pelo celular, sem digitar no computador."
	asideDescription="Abra o QR mostrado no Sonnda. O arquivo segue para o extrator e você não precisa entrar na conta."
	eyebrow="Captura"
	title={mode === 'needs-qr' ? 'Abra o QR novamente' : 'Enviar exame'}
	description="Esta página recebe o PDF a partir do QR do computador."
>
	{#if mode === 'checking' || mode === 'claiming'}
		<p role="status">
			{mode === 'checking' ? 'Verificando o link neste celular...' : 'Conectando este celular...'}
		</p>
	{:else if mode === 'needs-qr'}
		<Alert variant="warning">Abra novamente o QR no computador para enviar o exame.</Alert>
	{:else if presence.desktopPresent === false}
		<Alert variant="warning">Abra o Sonnda no computador. Este celular continua pareado.</Alert>
	{:else if presence.desktopPresent === true}
		<Alert variant="info">O computador está aberto. Este celular continua pareado.</Alert>
	{:else}
		<Alert variant="info">
			Este celular já tem uma sessão de captura. Não é preciso entrar na conta.
		</Alert>
	{/if}

	{#snippet footer()}
		O envio não pede login e não usa a área autenticada do Sonnda.
	{/snippet}
</AuthShell>
