<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { accountTypeLabel } from '#lib/features/account/presentation.js';
	import { auth, signOut } from '#lib/features/auth/auth.svelte.js';
	import AppHeader from '#lib/layout/AppHeader.svelte';
	import Alert from '#lib/ui/Alert.svelte';

	const { children } = $props();
	let loggingOut = $state(false);
	let logoutError = $state<string | null>(null);

	const displayName = $derived(
		currentAccount.account?.profile.full_name?.trim() ||
			auth.user?.email?.trim() ||
			'Usuário Sonnda'
	);
	const careType = $derived(accountTypeLabel(currentAccount.account?.account_type));

	async function handleSignOut() {
		logoutError = null;
		loggingOut = true;

		try {
			await signOut();
			await goto('/login');
		} catch {
			logoutError = 'Não foi possível sair agora. Tente novamente.';
		} finally {
			loggingOut = false;
		}
	}
</script>

<div class="min-h-screen bg-canvas text-on-canvas">
	<AppHeader {displayName} {careType} {loggingOut} onSignOut={handleSignOut} />
	{#if logoutError}
		<div class="mx-auto max-w-6xl px-6 pt-4 lg:px-8">
			<Alert variant="error">{logoutError}</Alert>
		</div>
	{/if}
	{@render children()}
</div>
