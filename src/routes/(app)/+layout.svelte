<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { accountTypeLabel } from '#lib/features/account/presentation.js';
	import { auth, signOut } from '#lib/features/auth/auth.svelte.js';
	import { CaptureLibrary } from '#lib/features/capture/captureLibrary.svelte.js';
	import CaptureInboxPanel from '#lib/features/capture/CaptureInboxPanel.svelte';
	import { DesktopCaptureConnection } from '#lib/features/capture/desktopCapture.svelte.js';
	import AppHeader from '#lib/layout/AppHeader.svelte';
	import ClinicalSidebar from '#lib/layout/ClinicalSidebar.svelte';
	import UserNavigation from '#lib/layout/UserNavigation.svelte';
	import WorkspaceLayout from '#lib/layout/WorkspaceLayout.svelte';
	import Alert from '#lib/ui/Alert.svelte';

	const { children } = $props();
	const connection = new DesktopCaptureConnection();
	const library = new CaptureLibrary();
	let capturesOpen = $state(false);
	let loggingOut = $state(false);
	let logoutError = $state<string | null>(null);

	const displayName = $derived(
		currentAccount.account?.profile.full_name?.trim() ||
			auth.user?.email?.trim() ||
			'Usuário Sonnda'
	);
	const careType = $derived(accountTypeLabel(currentAccount.account?.account_type));
	const showProfessionalActivation = $derived(
		currentAccount.account?.account_type === 'basic_care'
	);
	const inPatientContext = $derived(
		page.url.pathname === '/patients' || page.url.pathname.startsWith('/patients/')
	);
	const accountId = $derived(currentAccount.account?.id ?? null);
	const accessToken = $derived(auth.session?.access_token ?? null);

	$effect(() => {
		const accountChanged = connection.bindAccount(accountId, accessToken);
		library.bindAccount(accountId, accessToken);
		if (!accountChanged || !capturesOpen) return;
		connection.setPanelOpen(true);
		void connection.connect();
		void library.open();
	});

	onMount(() => {
		const visible = document.visibilityState === 'visible';
		connection.activate(visible);
		library.setVisible(visible);
		return () => {
			connection.deactivate();
			library.close();
		};
	});

	function onVisibilityChange() {
		const visible = document.visibilityState === 'visible';
		connection.setVisible(visible);
		library.setVisible(visible);
	}

	function openCaptures() {
		capturesOpen = true;
		connection.setPanelOpen(true);
		void connection.connect();
		void library.open();
	}

	function toggleCaptures() {
		if (capturesOpen) closeCaptures();
		else openCaptures();
	}

	function closeCaptures() {
		capturesOpen = false;
		connection.setPanelOpen(false);
		library.close();
		document.getElementById('captures-sidebar-button')?.focus();
	}

	async function handleSignOut() {
		logoutError = null;
		loggingOut = true;

		try {
			await connection.end();
			await signOut();
			await goto('/login');
		} catch {
			logoutError = 'Não foi possível sair agora. Tente novamente.';
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:document onvisibilitychange={onVisibilityChange} />

<div class="min-h-screen bg-canvas text-on-canvas">
	<AppHeader
		{displayName}
		{careType}
		{showProfessionalActivation}
		{loggingOut}
		returnHref={inPatientContext ? '/home' : undefined}
		returnLabel="Meus pacientes"
		onSignOut={handleSignOut}
	/>
	<UserNavigation />
	<div class="px-4 py-6 lg:px-6">
		<WorkspaceLayout>
			{#snippet left()}
				<ClinicalSidebar {capturesOpen} onCaptures={toggleCaptures}>
					{#snippet panel()}
						<CaptureInboxPanel {connection} {library} />
					{/snippet}
				</ClinicalSidebar>
			{/snippet}
			{#if logoutError}
				<Alert variant="error" class="mb-4">{logoutError}</Alert>
			{/if}
			{@render children()}
		</WorkspaceLayout>
	</div>
</div>
