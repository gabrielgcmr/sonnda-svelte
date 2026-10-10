<!-- src/routes/capture/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		captureLinkMode,
		readStoredCaptureCredential
	} from '#lib/features/capture/storedCredential.js';
	import Alert from '#lib/ui/Alert.svelte';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	const code = $derived(page.url.searchParams.get('code') ?? '');
	let storageChecked = $state(false);
	let hasCredential = $state(false);
	const mode = $derived(captureLinkMode({ code, storageChecked, hasCredential }));

	onMount(() => {
		hasCredential = readStoredCaptureCredential(sessionStorage) !== null;
		storageChecked = true;
	});
</script>

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
	{#if mode === 'checking'}
		<p role="status">Verificando o link neste celular...</p>
	{:else if mode === 'needs-qr'}
		<Alert variant="warning">Abra novamente o QR no computador para enviar o exame.</Alert>
	{:else if mode === 'resumed'}
		<Alert variant="info">
			Este celular já tem uma sessão de captura. Não é preciso entrar na conta.
		</Alert>
	{:else}
		<Alert variant="info">
			O link do computador foi aberto neste celular. Você não precisa entrar na conta.
		</Alert>
	{/if}

	{#snippet footer()}
		O envio não pede login e não usa a área autenticada do Sonnda.
	{/snippet}
</AuthShell>
