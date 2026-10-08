<!-- src/routes/register/+page.svelte -->
<script lang="ts">
	import { signUp } from '#lib/features/auth/auth.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import AuthShell from '#lib/ui/AuthShell.svelte';
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import TextField from '#lib/ui/TextField.svelte';

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

<AuthShell
	titleId="register-title"
	asideTitle="Comece hoje a cuidar melhor das suas informações de saúde."
	asideDescription="Crie sua conta para reunir seus dados com segurança e acompanhar o que importa."
	eyebrow={confirmationEmail ? 'Cadastro iniciado' : 'Primeiro acesso'}
	title={confirmationEmail ? 'Confira seu e-mail' : 'Crie sua conta'}
	description={confirmationEmail
		? `Enviamos as instruções de confirmação para ${confirmationEmail}.`
		: 'A segurança da senha segue a política configurada no Supabase.'}
>
	{#if confirmationEmail}
		<div class="text-center" role="status" aria-live="polite">
			<div
				class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-container text-on-success-container"
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
			<ButtonLink href="/login" class="mt-7">Ir para o login</ButtonLink>
		</div>
	{:else}
		<form class="space-y-5" onsubmit={handleSubmit} novalidate>
			<TextField
				id="register-email"
				name="email"
				label="E-mail"
				type="email"
				bind:value={email}
				autocomplete="email"
				inputmode="email"
				placeholder="voce@exemplo.com"
				disabled={submitting}
				invalid={Boolean(errorMessage)}
			/>

			<TextField
				id="register-password"
				name="password"
				label="Senha"
				type="password"
				bind:value={password}
				autocomplete="new-password"
				placeholder="Crie uma senha segura"
				disabled={submitting}
				invalid={Boolean(errorMessage)}
			/>

			<TextField
				id="password-confirmation"
				name="password-confirmation"
				label="Confirme a senha"
				type="password"
				bind:value={passwordConfirmation}
				autocomplete="new-password"
				placeholder="Digite a senha novamente"
				disabled={submitting}
				invalid={Boolean(errorMessage)}
			/>

			{#if errorMessage}
				<Alert variant="error">{errorMessage}</Alert>
			{/if}

			<Button type="submit" loading={submitting} class="w-full">
				{submitting ? 'Criando conta...' : 'Criar conta'}
			</Button>
		</form>

		<p class="mt-7 text-center text-sm text-on-surface-muted">
			Já tem uma conta?
			<a
				href="/login"
				class="font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
			>
				Entrar
			</a>
		</p>
	{/if}

	{#snippet footer()}
		Seus dados são protegidos e usados apenas para oferecer sua experiência no Sonnda.
	{/snippet}
</AuthShell>
