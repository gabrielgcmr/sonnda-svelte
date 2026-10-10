<!-- src/routes/(app)/professional-activation/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import Card from '#lib/ui/Card.svelte';
	import TextField from '#lib/ui/TextField.svelte';

	let password = $state('');
	let passwordError = $state<string | null>(null);

	const isProfessional = $derived(currentAccount.account?.account_type === 'professional');
	const activationMessage = $derived(
		currentAccount.professionalActivationProblem?.detail ??
			currentAccount.professionalActivationProblem?.title ??
			'Não foi possível ativar o perfil profissional.'
	);

	onMount(() => {
		currentAccount.clearProfessionalActivationProblem();
		return () => currentAccount.clearProfessionalActivationProblem();
	});

	function handlePasswordInput() {
		passwordError = null;
		currentAccount.clearProfessionalActivationProblem();
	}

	async function handleActivation(event: SubmitEvent) {
		event.preventDefault();
		if (!password.trim()) {
			passwordError = 'Informe a senha de ativação.';
			return;
		}

		const accessToken = auth.session?.access_token;
		if (!accessToken) {
			passwordError = 'Sua sessão não está disponível. Entre novamente.';
			return;
		}

		const activated = await currentAccount.activateProfessional(accessToken, password);
		if (activated) password = '';
	}
</script>

<svelte:head>
	<title>Ativação profissional | Sonnda</title>
	<meta
		name="description"
		content="Ative os recursos profissionais da sua conta Sonnda com a senha fornecida pela administração."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-4xl px-6 py-10 lg:px-8">
	<section aria-labelledby="professional-activation-title">
		<p class="text-sm font-semibold text-brand">Configuração da conta</p>
		<h1
			id="professional-activation-title"
			class="mt-2 text-3xl font-semibold tracking-tight text-on-canvas"
		>
			Ativação profissional
		</h1>
		<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
			Habilite os recursos destinados a profissionais usando a senha fornecida pela administração do
			Sonnda.
		</p>

		<Card class="mt-8 max-w-2xl">
			{#if isProfessional}
				<Alert variant="success">
					<p class="font-semibold">Sua conta profissional está ativa.</p>
					<p class="mt-1">Os recursos profissionais já estão disponíveis para esta conta.</p>
				</Alert>
				<div class="mt-6">
					<ButtonLink href="/home">Voltar para o início</ButtonLink>
				</div>
			{:else}
				<div class="flex items-start gap-4">
					<span
						class="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-container text-on-brand-container"
						aria-hidden="true"
					>
						<svg viewBox="0 0 24 24" fill="none" class="size-5">
							<path
								d="M12 13.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 6.25c.55-3.05 3.25-5.25 7-5.25s6.45 2.2 7 5.25"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
						</svg>
					</span>
					<div>
						<h2 class="font-semibold text-on-surface">Confirmar ativação</h2>
						<p class="mt-1 text-sm leading-6 text-on-surface-muted">
							A ativação altera permanentemente o tipo da conta para profissional.
						</p>
					</div>
				</div>

				<form class="mt-6 space-y-4" onsubmit={handleActivation}>
					<TextField
						id="professional-activation-password"
						name="professional-activation-password"
						label="Senha de ativação"
						type="password"
						autocomplete="off"
						bind:value={password}
						error={passwordError}
						oninput={handlePasswordInput}
						disabled={currentAccount.activatingProfessional}
						required
					/>

					{#if currentAccount.professionalActivationProblem}
						<Alert variant="error">{activationMessage}</Alert>
					{/if}

					<div class="flex flex-wrap gap-3">
						<Button type="submit" loading={currentAccount.activatingProfessional}>
							{currentAccount.activatingProfessional ? 'Ativando...' : 'Ativar como profissional'}
						</Button>
						<ButtonLink href="/home" variant="secondary">Cancelar</ButtonLink>
					</div>
				</form>
			{/if}
		</Card>
	</section>
</main>
