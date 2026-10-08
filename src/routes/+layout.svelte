<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { auth, destroyAuth, initAuth } from '../lib/auth.svelte';
	import { authRedirect, isAuthManagedRoute } from '../lib/authRouting';
	import './layout.css';

	const { children } = $props();
	let redirectingTo = $state<string | null>(null);

	const managedRoute = $derived(isAuthManagedRoute(page.url.pathname));
	const redirectTarget = $derived(
		auth.ready ? authRedirect(page.url.pathname, auth.session !== null) : null
	);
	const showContent = $derived(!managedRoute || (auth.ready && redirectTarget === null));

	onMount(() => {
		void initAuth();
		return destroyAuth;
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
	<main class="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
		<div class="text-center" role="status" aria-live="polite">
			<div
				class="mx-auto size-8 animate-spin rounded-full border-2 border-teal-100 border-t-teal-700"
				aria-hidden="true"
			></div>
			<p class="mt-4 text-sm font-medium text-slate-600">
				{auth.ready ? 'Redirecionando...' : 'Verificando sua sessão...'}
			</p>
		</div>
	</main>
{/if}
