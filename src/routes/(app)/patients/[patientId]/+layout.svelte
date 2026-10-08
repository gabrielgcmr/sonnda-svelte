<!-- src/routes/(app)/patients/[patientId]/+layout.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import { patientSection } from '#lib/features/patient/navigation.js';
	import {
		formatPatientCpf,
		formatPatientDate,
		patientAge,
		patientGenderLabel,
		patientRaceLabel
	} from '#lib/features/patient/presentation.js';
	import { patientWorkspace } from '#lib/features/patient/patientWorkspace.svelte.js';
	import PatientIdentity from '#lib/layout/PatientIdentity.svelte';
	import PatientNavigation from '#lib/layout/PatientNavigation.svelte';
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

{#if patient}
	<PatientIdentity
		fullName={patient.full_name}
		age={patientAge(patient.birth_date)}
		birthDate={formatPatientDate(patient.birth_date)}
		cpf={formatPatientCpf(patient.cpf)}
		cns={patient.cns}
		phone={patient.phone}
		gender={patientGenderLabel(patient.gender)}
		race={patientRaceLabel(patient.race)}
	/>

	<div
		class="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_4rem] items-start gap-6 px-6 py-8 lg:px-8"
	>
		<main>
			{@render children()}
		</main>
		<PatientNavigation {patientId} {activeSection} />
	</div>
{:else if loading}
	<section
		class="border-b border-border bg-surface-muted"
		aria-label="Carregando paciente"
		aria-busy="true"
	>
		<div class="mx-auto max-w-6xl animate-pulse px-6 py-5 lg:px-8">
			<div class="h-3 w-20 rounded bg-border"></div>
			<div class="mt-3 h-7 w-72 rounded bg-border"></div>
			<div class="mt-5 h-10 max-w-xl rounded bg-border"></div>
		</div>
	</section>
	<div class="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
		<div class="h-64 animate-pulse rounded-2xl border border-border bg-surface-muted"></div>
	</div>
{:else}
	<section class="border-b border-border bg-surface-muted">
		<div class="mx-auto max-w-6xl px-6 py-5 lg:px-8">
			<p class="text-xs font-semibold tracking-wide text-danger uppercase">Paciente indisponível</p>
			<h1 class="mt-1 text-2xl font-semibold tracking-tight">{patientErrorTitle()}</h1>
		</div>
	</section>
	<main class="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
		<Alert variant="error">
			<p>A API não disponibilizou os dados deste paciente para a conta atual.</p>
		</Alert>
		<div class="mt-5 flex flex-wrap gap-3">
			<Button onclick={retry}>Tentar novamente</Button>
			<ButtonLink href="/home" variant="secondary">Voltar para meus pacientes</ButtonLink>
		</div>
	</main>
{/if}
