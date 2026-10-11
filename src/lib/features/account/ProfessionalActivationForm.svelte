<!-- src/lib/features/account/ProfessionalActivationForm.svelte -->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import TextField from '#lib/ui/TextField.svelte';

	type Props = {
		disabled?: boolean;
		actions?: Snippet;
	};

	let { disabled = false, actions }: Props = $props();

	let password = $state('');
	let passwordError = $state<string | null>(null);

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
		if (disabled || currentAccount.activatingProfessional) return;
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

<form class="space-y-4" onsubmit={handleActivation} novalidate>
	<TextField
		id="professional-activation-password"
		name="professional-activation-password"
		label="Senha de ativação"
		type="password"
		autocomplete="off"
		bind:value={password}
		error={passwordError}
		oninput={handlePasswordInput}
		disabled={disabled || currentAccount.activatingProfessional}
		required
	/>

	{#if currentAccount.professionalActivationProblem}
		<Alert variant="error">{activationMessage}</Alert>
	{/if}

	<div class="flex flex-wrap gap-3">
		<Button type="submit" loading={currentAccount.activatingProfessional} {disabled}>
			{currentAccount.activatingProfessional ? 'Ativando...' : 'Ativar como profissional'}
		</Button>
		{@render actions?.()}
	</div>
</form>
