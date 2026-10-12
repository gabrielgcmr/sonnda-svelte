<!-- src/routes/(app)/patients/[patientId]/+layout.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import { patientSection } from '#lib/features/patient/navigation.js';
	import PatientContextPanel from '#lib/features/patient/PatientContextPanel.svelte';
	import { patientWorkspace } from '#lib/features/patient/patientWorkspace.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';

	const { children } = $props();
	const activeSection = $derived(patientSection(page.url.searchParams.get('tab')));
	const patientId = $derived(page.params.patientId ?? '');
	const accessToken = $derived(auth.session?.access_token ?? null);
	const accountId = $derived(currentAccount.account?.id ?? null);
	const patient = $derived(
		patientWorkspace.selectedPatientId === patientId ? patientWorkspace.selectedPatient : null
	);
	const loading = $derived(
		patientWorkspace.selectedPatientId !== patientId || patientWorkspace.patientStatus === 'loading'
	);

	$effect(() => {
		if (!accessToken || !accountId || !patientId) return;
		void patientWorkspace.ensurePatient(accessToken, accountId, patientId);
	});

	function retry() {
		if (!accessToken || !accountId || !patientId) return;
		void patientWorkspace.reloadPatient(accessToken, accountId, patientId);
	}

	function patientErrorTitle() {
		if (patientWorkspace.patientProblem?.status === 403) {
			return 'Você não tem acesso a este paciente';
		}
		if (patientWorkspace.patientProblem?.status === 404) return 'Paciente não encontrado';
		return 'Não foi possível abrir o paciente';
	}
</script>

<div
	class="flex min-w-0 flex-col-reverse gap-6 @min-[48rem]/workspace:flex-row @min-[48rem]/workspace:items-start"
>
	<div class="w-full min-w-0 flex-1">
		{#if patient}
			{@render children()}
		{:else if loading}
			<div
				class="h-64 animate-pulse rounded-2xl border border-border bg-surface-muted"
				aria-hidden="true"
			></div>
		{:else}
			<section>
				<p class="text-xs font-semibold tracking-wide text-danger uppercase">
					Paciente indisponível
				</p>
				<h1 class="mt-1 text-2xl font-semibold tracking-tight">{patientErrorTitle()}</h1>
				<Alert variant="error" class="mt-5">
					<p>A API não disponibilizou os dados deste paciente para a conta atual.</p>
				</Alert>
				<div class="mt-5 flex flex-wrap gap-3">
					<Button onclick={retry}>Tentar novamente</Button>
					<ButtonLink href="/home" variant="secondary">Voltar para meus pacientes</ButtonLink>
				</div>
			</section>
		{/if}
	</div>

	{#if patient}
		<PatientContextPanel {patient} {patientId} {activeSection} />
	{:else if loading}
		<aside
			class="h-80 w-full shrink-0 animate-pulse rounded-2xl border border-border bg-surface-muted @min-[48rem]/workspace:w-[280px]"
			aria-label="Carregando paciente"
			aria-busy="true"
		></aside>
	{/if}
</div>
