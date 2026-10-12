<!-- src/routes/(app)/professional-activation/+page.svelte -->
<script lang="ts">
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import ProfessionalActivationForm from '#lib/features/account/ProfessionalActivationForm.svelte';
	import Alert from '#lib/ui/Alert.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import Card from '#lib/ui/Card.svelte';

	const isProfessional = $derived(currentAccount.account?.account_type === 'professional');
</script>

<svelte:head>
	<title>Ativação profissional | Sonnda</title>
	<meta
		name="description"
		content="Ative os recursos profissionais da sua conta Sonnda com a senha fornecida pela administração."
	/>
</svelte:head>

<main class="w-full min-w-0 py-4">
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

				<div class="mt-6">
					<ProfessionalActivationForm>
						{#snippet actions()}
							<ButtonLink href="/home" variant="secondary">Cancelar</ButtonLink>
						{/snippet}
					</ProfessionalActivationForm>
				</div>
			{/if}
		</Card>
	</section>
</main>
