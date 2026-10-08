<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, signIn } from '../../lib/auth.svelte';
	import Alert from '../../lib/ui/Alert.svelte';
	import AuthShell from '../../lib/ui/AuthShell.svelte';
	import Button from '../../lib/ui/Button.svelte';
	import TextField from '../../lib/ui/TextField.svelte';

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

<AuthShell
	titleId="login-title"
	asideTitle="Sua saúde organizada, compreendida e sempre por perto."
	asideDescription="Acesse seus dados de saúde com segurança e acompanhe o que importa em um só lugar."
	eyebrow="Bem-vindo de volta"
	title="Entre na sua conta"
	description="Use o e-mail e a senha cadastrados no Sonnda."
>
	<form class="space-y-5" onsubmit={handleSubmit} novalidate>
		<TextField
			id="email"
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
			id="password"
			name="password"
			label="Senha"
			type="password"
			bind:value={password}
			autocomplete="current-password"
			placeholder="Digite sua senha"
			disabled={submitting}
			invalid={Boolean(errorMessage)}
		/>

		{#if errorMessage}
			<Alert variant="error">{errorMessage}</Alert>
		{/if}

		{#if auth.initializationError}
			<Alert variant="warning">
				A sessão não pôde ser restaurada, mas você ainda pode tentar entrar.
			</Alert>
		{/if}

		<Button type="submit" loading={submitting} class="w-full">
			{submitting ? 'Entrando...' : 'Entrar'}
		</Button>
	</form>

	<p class="mt-7 text-center text-sm text-on-surface-muted">
		Ainda não tem uma conta?
		<a
			href="/register"
			class="font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
		>
			Cadastre-se
		</a>
	</p>

	{#snippet footer()}
		Seus dados são protegidos e usados apenas para oferecer sua experiência no Sonnda.
	{/snippet}
</AuthShell>
