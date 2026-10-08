<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, signIn } from '../../lib/auth.svelte';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	function authErrorMessage(error: unknown) {
		if (!error || typeof error !== 'object' || !('code' in error)) {
			return 'Não foi possível entrar agora. Tente novamente em instantes.';
		}

		switch (error.code) {
			case 'invalid_credentials':
				return 'E-mail ou senha inválidos.';
			case 'email_not_confirmed':
				return 'Confirme seu e-mail antes de entrar.';
			case 'user_banned':
				return 'Esta conta não está disponível. Entre em contato com o suporte.';
			case 'over_request_rate_limit':
			case 'request_timeout':
				return 'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.';
			default:
				return 'Não foi possível entrar agora. Tente novamente em instantes.';
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;

		const normalizedEmail = email.trim();
		if (!normalizedEmail || !password) {
			errorMessage = 'Preencha o e-mail e a senha.';
			return;
		}

		submitting = true;

		try {
			await signIn(normalizedEmail, password);
			await goto('/home');
		} catch (error) {
			errorMessage = authErrorMessage(error);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Entrar | Sonnda</title>
	<meta
		name="description"
		content="Entre na sua conta Sonnda para acessar suas informações de saúde."
	/>
</svelte:head>

<main class="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
	<div class="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-2">
		<section class="hidden lg:block" aria-labelledby="welcome-title">
			<p class="mb-5 text-sm font-semibold tracking-[0.22em] text-teal-700 uppercase">Sonnda</p>
			<h1 id="welcome-title" class="max-w-xl text-5xl leading-[1.08] font-semibold tracking-tight">
				Sua saúde organizada, compreendida e sempre por perto.
			</h1>
			<p class="mt-6 max-w-lg text-lg leading-8 text-slate-600">
				Acesse seus dados de saúde com segurança e acompanhe o que importa em um só lugar.
			</p>
		</section>

		<section class="mx-auto w-full max-w-md" aria-labelledby="login-title">
			<div class="mb-8 lg:hidden">
				<p class="text-sm font-semibold tracking-[0.22em] text-teal-700 uppercase">Sonnda</p>
			</div>

			<div
				class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9"
			>
				<div class="mb-8">
					<p class="text-sm font-medium text-teal-700">Bem-vindo de volta</p>
					<h2 id="login-title" class="mt-2 text-3xl font-semibold tracking-tight">
						Entre na sua conta
					</h2>
					<p class="mt-3 text-sm leading-6 text-slate-600">
						Use o e-mail e a senha cadastrados no Sonnda.
					</p>
				</div>

				<form class="space-y-5" onsubmit={handleSubmit} novalidate>
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-slate-800">E-mail</label>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							autocomplete="email"
							inputmode="email"
							placeholder="voce@exemplo.com"
							disabled={submitting}
							aria-invalid={errorMessage ? 'true' : undefined}
							class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base transition outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
					</div>

					<div>
						<label for="password" class="mb-2 block text-sm font-medium text-slate-800">Senha</label
						>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							autocomplete="current-password"
							placeholder="Digite sua senha"
							disabled={submitting}
							aria-invalid={errorMessage ? 'true' : undefined}
							class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base transition outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
					</div>

					{#if errorMessage}
						<div
							class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
							role="alert"
							aria-live="polite"
						>
							{errorMessage}
						</div>
					{/if}

					{#if auth.initializationError}
						<p class="text-sm leading-5 text-amber-800" role="status">
							A sessão não pôde ser restaurada, mas você ainda pode tentar entrar.
						</p>
					{/if}

					<button
						type="submit"
						disabled={submitting}
						class="flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
					>
						{#if submitting}
							<span
								class="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
								aria-hidden="true"
							></span>
							<span>Entrando...</span>
						{:else}
							<span>Entrar</span>
						{/if}
					</button>
				</form>

				<p class="mt-7 text-center text-sm text-slate-600">
					Ainda não tem uma conta?
					<a
						href="/register"
						class="font-semibold text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
					>
						Cadastre-se
					</a>
				</p>
			</div>

			<p class="mt-6 text-center text-xs leading-5 text-slate-500">
				Seus dados são protegidos e usados apenas para oferecer sua experiência no Sonnda.
			</p>
		</section>
	</div>
</main>
