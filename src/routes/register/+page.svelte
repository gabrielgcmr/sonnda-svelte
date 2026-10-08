<!-- src/routes/register/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { signUp } from '../../lib/auth.svelte';

	let email = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let confirmationEmail = $state<string | null>(null);

	function validEmail(value: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	function signUpErrorMessage(error: unknown) {
		if (!error || typeof error !== 'object' || !('code' in error)) {
			return 'Não foi possível criar sua conta agora. Tente novamente em instantes.';
		}

		switch (error.code) {
			case 'email_exists':
			case 'user_already_exists':
				return 'Já existe uma conta associada a este e-mail.';
			case 'email_address_invalid':
				return 'Informe um endereço de e-mail válido.';
			case 'weak_password':
				return 'A senha não atende aos requisitos de segurança. Escolha uma senha mais forte.';
			case 'signup_disabled':
			case 'email_provider_disabled':
				return 'A criação de contas não está disponível no momento.';
			case 'over_email_send_rate_limit':
			case 'over_request_rate_limit':
			case 'request_timeout':
				return 'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.';
			default:
				return 'Não foi possível criar sua conta agora. Tente novamente em instantes.';
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;

		const normalizedEmail = email.trim();
		if (!normalizedEmail || !password || !passwordConfirmation) {
			errorMessage = 'Preencha todos os campos.';
			return;
		}
		if (!validEmail(normalizedEmail)) {
			errorMessage = 'Informe um endereço de e-mail válido.';
			return;
		}
		if (password !== passwordConfirmation) {
			errorMessage = 'As senhas informadas não são iguais.';
			return;
		}

		submitting = true;

		try {
			const data = await signUp(normalizedEmail, password);

			if (data.session) {
				await goto('/home');
				return;
			}

			confirmationEmail = normalizedEmail;
			password = '';
			passwordConfirmation = '';
		} catch (error) {
			errorMessage = signUpErrorMessage(error);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Criar conta | Sonnda</title>
	<meta name="description" content="Crie sua conta Sonnda para organizar seus dados de saúde." />
</svelte:head>

<main class="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
	<div class="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-2">
		<section class="hidden lg:block" aria-labelledby="register-welcome-title">
			<p class="mb-5 text-sm font-semibold tracking-[0.22em] text-teal-700 uppercase">Sonnda</p>
			<h1
				id="register-welcome-title"
				class="max-w-xl text-5xl leading-[1.08] font-semibold tracking-tight"
			>
				Comece hoje a cuidar melhor das suas informações de saúde.
			</h1>
			<p class="mt-6 max-w-lg text-lg leading-8 text-slate-600">
				Crie sua conta para reunir seus dados com segurança e acompanhar o que importa.
			</p>
		</section>

		<section class="mx-auto w-full max-w-md" aria-labelledby="register-title">
			<div class="mb-8 lg:hidden">
				<p class="text-sm font-semibold tracking-[0.22em] text-teal-700 uppercase">Sonnda</p>
			</div>

			<div
				class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9"
			>
				{#if confirmationEmail}
					<div class="text-center" role="status" aria-live="polite">
						<div
							class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
						>
							<svg viewBox="0 0 24 24" fill="none" class="size-7" aria-hidden="true">
								<path
									d="m5 12 4 4L19 6"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<h2 id="register-title" class="mt-6 text-3xl font-semibold tracking-tight">
							Confira seu e-mail
						</h2>
						<p class="mt-3 leading-7 text-slate-600">
							Enviamos as instruções de confirmação para
							<strong class="font-semibold text-slate-800">{confirmationEmail}</strong>.
						</p>
						<a
							href="/login"
							class="mt-7 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
						>
							Ir para o login
						</a>
					</div>
				{:else}
					<div class="mb-8">
						<p class="text-sm font-medium text-teal-700">Primeiro acesso</p>
						<h2 id="register-title" class="mt-2 text-3xl font-semibold tracking-tight">
							Crie sua conta
						</h2>
						<p class="mt-3 text-sm leading-6 text-slate-600">
							A segurança da senha segue a política configurada no Supabase.
						</p>
					</div>

					<form class="space-y-5" onsubmit={handleSubmit} novalidate>
						<div>
							<label for="register-email" class="mb-2 block text-sm font-medium text-slate-800">
								E-mail
							</label>
							<input
								id="register-email"
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
							<label for="register-password" class="mb-2 block text-sm font-medium text-slate-800">
								Senha
							</label>
							<input
								id="register-password"
								name="password"
								type="password"
								bind:value={password}
								autocomplete="new-password"
								placeholder="Crie uma senha segura"
								disabled={submitting}
								aria-invalid={errorMessage ? 'true' : undefined}
								class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base transition outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
							/>
						</div>

						<div>
							<label
								for="password-confirmation"
								class="mb-2 block text-sm font-medium text-slate-800"
							>
								Confirme a senha
							</label>
							<input
								id="password-confirmation"
								name="password-confirmation"
								type="password"
								bind:value={passwordConfirmation}
								autocomplete="new-password"
								placeholder="Digite a senha novamente"
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
								<span>Criando conta...</span>
							{:else}
								<span>Criar conta</span>
							{/if}
						</button>
					</form>

					<p class="mt-7 text-center text-sm text-slate-600">
						Já tem uma conta?
						<a
							href="/login"
							class="font-semibold text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
						>
							Entrar
						</a>
					</p>
				{/if}
			</div>

			<p class="mt-6 text-center text-xs leading-5 text-slate-500">
				Seus dados são protegidos e usados apenas para oferecer sua experiência no Sonnda.
			</p>
		</section>
	</div>
</main>
