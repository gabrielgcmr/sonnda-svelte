<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth, destroyAuth, initAuth } from '#lib/features/auth/auth.svelte.js';
	import { authRedirect, isAuthManagedRoute } from '#lib/features/auth/routing.js';
	import Button from '#lib/ui/Button.svelte';
	import { theme } from '#lib/ui/theme.svelte.js';
	import '../styles/app.css';

	const { children } = $props();
	let redirectingTo = $state<string | null>(null);

	const managedRoute = $derived(isAuthManagedRoute(page.url.pathname));
	const redirectTarget = $derived(
		auth.ready
			? authRedirect(page.url.pathname, {
					authenticated: auth.session !== null,
					accountStatus: currentAccount.status,
					onboardingCompleted: currentAccount.account?.onboarding_completed ?? null
				})
			: null
	);
	const accountError = $derived(
		managedRoute && auth.ready && auth.session !== null && currentAccount.status === 'error'
	);
	const resolvingAccount = $derived(
		auth.session !== null &&
			(currentAccount.status === 'idle' || currentAccount.status === 'loading')
	);
	const showContent = $derived(
		!managedRoute || (auth.ready && !resolvingAccount && !accountError && redirectTarget === null)
	);

	async function retryAccount() {
		if (auth.session && currentAccount.status === 'error') {
			await currentAccount.load(auth.session.access_token);
		}
	}

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
{:else if accountError}
	<main class="grid min-h-screen place-items-center bg-canvas px-4 text-on-canvas">
		<section class="max-w-md text-center" aria-labelledby="account-error-title">
			<h1 id="account-error-title" class="text-2xl font-semibold">
				Não foi possível carregar sua conta
			</h1>
			<p class="mt-3 text-on-surface-muted">Verifique sua conexão e tente novamente.</p>
			<Button onclick={retryAccount} class="mt-6">Tentar novamente</Button>
		</section>
	</main>
{:else}
	<main class="grid min-h-screen place-items-center bg-canvas px-4 text-on-canvas">
		<div class="text-center" role="status" aria-live="polite">
			<div
				class="mx-auto size-8 animate-spin rounded-full border-2 border-brand/25 border-t-brand"
				aria-hidden="true"
			></div>
			<p class="mt-4 text-sm font-medium text-on-surface-muted">
				{!auth.ready
					? 'Verificando sua sessão...'
					: resolvingAccount
						? 'Carregando sua conta...'
						: 'Redirecionando...'}
			</p>
		</div>
	</main>
{/if}
