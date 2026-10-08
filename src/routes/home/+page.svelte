<!-- src/routes/home/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth, signOut } from '#lib/features/auth/auth.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import Card from '#lib/ui/Card.svelte';
	import ThemeToggle from '#lib/ui/ThemeToggle.svelte';

	let loggingOut = $state(false);
	let logoutError = $state<string | null>(null);

	const displayName = $derived(
		currentAccount.account?.profile.full_name?.trim() || auth.user?.email || 'Olá'
	);
	const accountEmail = $derived(
		currentAccount.account?.email || auth.user?.email || 'Não informado'
	);
	const accountType = $derived(
		currentAccount.account?.account_type === 'professional' ? 'Profissional' : 'Cuidado pessoal'
	);

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('pt-BR', {
			dateStyle: 'long',
			timeZone: 'America/Sao_Paulo'
		}).format(new Date(value));
	}

	async function retryAccount() {
		if (auth.session) await currentAccount.load(auth.session.access_token);
	}

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

<svelte:head>
	<title>Início | Sonnda</title>
	<meta name="description" content="Acompanhe sua conta e suas informações de saúde no Sonnda." />
</svelte:head>

<main class="min-h-screen bg-canvas text-on-canvas">
	<header class="border-b border-border bg-surface">
		<div
			class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
		>
			<a href="/home" class="text-sm font-bold tracking-[0.22em] text-brand uppercase"> Sonnda </a>

			<div class="flex items-center gap-2 sm:gap-3">
				<ThemeToggle />
				{#if auth.session}
					<Button variant="secondary" size="sm" onclick={handleSignOut} loading={loggingOut}>
						<span class="hidden sm:inline">{loggingOut ? 'Saindo...' : 'Sair'}</span>
						<span class="sm:hidden">Sair</span>
					</Button>
				{/if}
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		{#if !auth.ready}
			<section aria-label="Carregando sua conta" aria-busy="true">
				<div class="h-5 w-32 animate-pulse rounded-full bg-surface-muted"></div>
				<div class="mt-4 h-12 max-w-lg animate-pulse rounded-2xl bg-surface-muted"></div>
				<div class="mt-10 grid gap-5 md:grid-cols-3">
					{#each [0, 1, 2] as skeleton (skeleton)}
						<div class="h-36 animate-pulse rounded-2xl border border-border bg-surface"></div>
					{/each}
				</div>
			</section>
		{:else if !auth.session}
			<section class="mx-auto max-w-xl py-16 text-center" aria-labelledby="session-title">
				<div
					class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-warning-container text-on-warning-container"
				>
					<svg viewBox="0 0 24 24" fill="none" class="size-7" aria-hidden="true">
						<path
							d="M12 9v4m0 4h.01M10.3 4.2 3.6 16a2 2 0 0 0 1.74 3h13.32a2 2 0 0 0 1.74-3L13.7 4.2a2 2 0 0 0-3.4 0Z"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<h1 id="session-title" class="mt-6 text-3xl font-semibold tracking-tight">
					Sua sessão não está ativa
				</h1>
				<p class="mt-3 leading-7 text-on-surface-muted">
					Entre novamente para acessar sua conta Sonnda.
				</p>
				<ButtonLink href="/login" class="mt-7">Ir para o login</ButtonLink>
			</section>
		{:else if currentAccount.loading}
			<section aria-label="Carregando os dados da conta" aria-busy="true">
				<p class="text-sm font-medium text-brand">Preparando seu espaço</p>
				<div class="mt-3 h-12 max-w-xl animate-pulse rounded-2xl bg-surface-muted"></div>
				<div class="mt-10 grid gap-5 md:grid-cols-3">
					{#each [0, 1, 2] as skeleton (skeleton)}
						<div class="h-36 animate-pulse rounded-2xl border border-border bg-surface"></div>
					{/each}
				</div>
			</section>
		{:else if currentAccount.problem || !currentAccount.account}
			<section class="mx-auto max-w-xl py-16 text-center" aria-labelledby="account-error-title">
				<div
					class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-container text-on-danger-container"
				>
					<svg viewBox="0 0 24 24" fill="none" class="size-7" aria-hidden="true">
						<path
							d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<h1 id="account-error-title" class="mt-6 text-3xl font-semibold tracking-tight">
					Não foi possível carregar sua conta
				</h1>
				<p class="mt-3 leading-7 text-on-surface-muted">
					Verifique se a API está disponível e tente novamente.
				</p>
				<Button onclick={retryAccount} class="mt-7">Tentar novamente</Button>
			</section>
		{:else}
			<section aria-labelledby="home-title">
				<p class="text-sm font-semibold text-brand">Visão geral</p>
				<h1 id="home-title" class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
					Bem-vindo, {displayName}!
				</h1>
				<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
					Este é o seu espaço no Sonnda. Aqui você poderá acompanhar suas informações de saúde.
				</p>

				{#if logoutError}
					<Alert variant="error" class="mt-6">{logoutError}</Alert>
				{/if}

				<div class="mt-10 grid gap-5 md:grid-cols-3">
					<article>
						<Card class="h-full">
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-brand-container text-on-brand-container"
							>
								<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
									<path
										d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</div>
							<p class="mt-5 text-sm text-on-surface-muted">Tipo de conta</p>
							<p class="mt-1 text-lg font-semibold">{accountType}</p>
						</Card>
					</article>

					<article>
						<Card class="h-full">
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-brand"
							>
								<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
									<path
										d="m4 6 8 6 8-6M5 19h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</div>
							<p class="mt-5 text-sm text-on-surface-muted">E-mail</p>
							<p class="mt-1 truncate text-lg font-semibold" title={accountEmail}>{accountEmail}</p>
						</Card>
					</article>

					<article>
						<Card class="h-full">
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-brand"
							>
								<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
									<path
										d="M8 3v3m8-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</div>
							<p class="mt-5 text-sm text-on-surface-muted">Conta criada em</p>
							<p class="mt-1 text-lg font-semibold">
								{formatDate(currentAccount.account.created_at)}
							</p>
						</Card>
					</article>
				</div>

				<section class="mt-8" aria-labelledby="account-title">
					<Card>
						<div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<p class="text-sm font-medium text-brand">Sua conta</p>
								<h2 id="account-title" class="mt-1 text-xl font-semibold">Detalhes da conta</h2>
							</div>
							<span
								class={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
									currentAccount.account.onboarding_completed
										? 'bg-success-container text-on-success-container'
										: 'bg-warning-container text-on-warning-container'
								}`}
							>
								{currentAccount.account.onboarding_completed
									? 'Cadastro completo'
									: 'Cadastro pendente'}
							</span>
						</div>

						<dl class="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
							<div>
								<dt class="text-sm text-on-surface-muted">Nome</dt>
								<dd class="mt-1 font-medium">
									{currentAccount.account.profile.full_name || 'Não informado'}
								</dd>
							</div>
							<div>
								<dt class="text-sm text-on-surface-muted">Identificador da conta</dt>
								<dd class="mt-1 font-mono text-sm break-all text-on-surface-muted">
									{currentAccount.account.id}
								</dd>
							</div>
						</dl>
					</Card>
				</section>
			</section>
		{/if}
	</div>
</main>
