<!-- src/routes/home/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentAccount } from '../../lib/account.svelte';
	import { auth, signOut } from '../../lib/auth.svelte';

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
		if (auth.session) {
			await currentAccount.load(auth.session);
		}
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

<main class="min-h-screen bg-slate-50 text-slate-950">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<a href="/home" class="text-sm font-bold tracking-[0.22em] text-teal-700 uppercase">
				Sonnda
			</a>

			{#if auth.session}
				<button
					type="button"
					onclick={handleSignOut}
					disabled={loggingOut}
					class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loggingOut ? 'Saindo...' : 'Sair'}
				</button>
			{/if}
		</div>
	</header>

	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		{#if !auth.ready}
			<section aria-label="Carregando sua conta" aria-busy="true">
				<div class="h-5 w-32 animate-pulse rounded-full bg-slate-200"></div>
				<div class="mt-4 h-12 max-w-lg animate-pulse rounded-2xl bg-slate-200"></div>
				<div class="mt-10 grid gap-5 md:grid-cols-3">
					{#each [0, 1, 2] as skeleton (skeleton)}
						<div class="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
					{/each}
				</div>
			</section>
		{:else if !auth.session}
			<section class="mx-auto max-w-xl py-16 text-center" aria-labelledby="session-title">
				<div
					class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"
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
				<p class="mt-3 leading-7 text-slate-600">Entre novamente para acessar sua conta Sonnda.</p>
				<a
					href="/login"
					class="mt-7 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
				>
					Ir para o login
				</a>
			</section>
		{:else if currentAccount.loading}
			<section aria-label="Carregando os dados da conta" aria-busy="true">
				<p class="text-sm font-medium text-teal-700">Preparando seu espaço</p>
				<div class="mt-3 h-12 max-w-xl animate-pulse rounded-2xl bg-slate-200"></div>
				<div class="mt-10 grid gap-5 md:grid-cols-3">
					{#each [0, 1, 2] as skeleton (skeleton)}
						<div class="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
					{/each}
				</div>
			</section>
		{:else if currentAccount.problem || !currentAccount.account}
			<section class="mx-auto max-w-xl py-16 text-center" aria-labelledby="account-error-title">
				<div
					class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-700"
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
				<p class="mt-3 leading-7 text-slate-600">
					Verifique se a API está disponível e tente novamente.
				</p>
				<button
					type="button"
					onclick={retryAccount}
					class="mt-7 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
				>
					Tentar novamente
				</button>
			</section>
		{:else}
			<section aria-labelledby="home-title">
				<p class="text-sm font-semibold text-teal-700">Visão geral</p>
				<h1 id="home-title" class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
					Bem-vindo, {displayName}!
				</h1>
				<p class="mt-3 max-w-2xl leading-7 text-slate-600">
					Este é o seu espaço no Sonnda. Aqui você poderá acompanhar suas informações de saúde.
				</p>

				{#if logoutError}
					<div
						class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
						role="alert"
					>
						{logoutError}
					</div>
				{/if}

				<div class="mt-10 grid gap-5 md:grid-cols-3">
					<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div
							class="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"
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
						<p class="mt-5 text-sm text-slate-500">Tipo de conta</p>
						<p class="mt-1 text-lg font-semibold">{accountType}</p>
					</article>

					<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div
							class="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
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
						<p class="mt-5 text-sm text-slate-500">E-mail</p>
						<p class="mt-1 truncate text-lg font-semibold" title={accountEmail}>{accountEmail}</p>
					</article>

					<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div
							class="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"
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
						<p class="mt-5 text-sm text-slate-500">Conta criada em</p>
						<p class="mt-1 text-lg font-semibold">
							{formatDate(currentAccount.account.created_at)}
						</p>
					</article>
				</div>

				<section
					class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
					aria-labelledby="account-title"
				>
					<div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p class="text-sm font-medium text-teal-700">Sua conta</p>
							<h2 id="account-title" class="mt-1 text-xl font-semibold">Detalhes da conta</h2>
						</div>
						<span
							class={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
								currentAccount.account.onboarding_completed
									? 'bg-emerald-100 text-emerald-800'
									: 'bg-amber-100 text-amber-800'
							}`}
						>
							{currentAccount.account.onboarding_completed
								? 'Cadastro completo'
								: 'Cadastro pendente'}
						</span>
					</div>

					<dl class="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
						<div>
							<dt class="text-sm text-slate-500">Nome</dt>
							<dd class="mt-1 font-medium">
								{currentAccount.account.profile.full_name || 'Não informado'}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-slate-500">Identificador da conta</dt>
							<dd class="mt-1 font-mono text-sm break-all text-slate-700">
								{currentAccount.account.id}
							</dd>
						</div>
					</dl>
				</section>
			</section>
		{/if}
	</div>
</main>
