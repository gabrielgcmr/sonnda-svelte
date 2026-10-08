<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { auth, destroyAuth, initAuth } from '../lib/auth.svelte';
	import { authRedirect, isAuthManagedRoute } from '../lib/authRouting';
	import { theme } from '../lib/ui/theme.svelte';
	import '../styles/app.css';

	const { children } = $props();
	let redirectingTo = $state<string | null>(null);

	const managedRoute = $derived(isAuthManagedRoute(page.url.pathname));
	const redirectTarget = $derived(
		auth.ready ? authRedirect(page.url.pathname, auth.session !== null) : null
	);
	const showContent = $derived(!managedRoute || (auth.ready && redirectTarget === null));

	onMount(() => {
		theme.init();
		void initAuth();
		return () => {
			theme.destroy();
			destroyAuth();
		};
	});

	$effect(() => {
		const target = redirectTarget;
		if (!browser || !target || redirectingTo === target) return;

		redirectingTo = target;
		void goto(target, { replaceState: true }).finally(() => {
			if (redirectingTo === target) {
				redirectingTo = null;
			}
		});
	});
</script>

{#if showContent}
	{@render children()}
{:else}
	<main class="grid min-h-screen place-items-center bg-canvas px-4 text-on-canvas">
		<div class="text-center" role="status" aria-live="polite">
			<div
				class="mx-auto size-8 animate-spin rounded-full border-2 border-brand/25 border-t-brand"
				aria-hidden="true"
			></div>
			<p class="mt-4 text-sm font-medium text-on-surface-muted">
				{auth.ready ? 'Redirecionando...' : 'Verificando sua sessão...'}
			</p>
		</div>
	</main>
{/if}
