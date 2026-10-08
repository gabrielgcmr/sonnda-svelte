<!-- src/routes/(app)/home/+page.svelte -->
<script lang="ts">
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import { patientInitials } from '#lib/features/patient/presentation.js';
	import { patientWorkspace } from '#lib/features/patient/patientWorkspace.svelte.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';

	const accessToken = $derived(auth.session?.access_token ?? null);
	const accountId = $derived(currentAccount.account?.id ?? null);
	const filteredPatients = $derived(patientWorkspace.filteredPatients);
	const patientCountLabel = $derived(
		`${filteredPatients.length} ${filteredPatients.length === 1 ? 'paciente' : 'pacientes'}`
	);

	$effect(() => {
		if (!accessToken || !accountId) return;
		void patientWorkspace.ensureList(accessToken, accountId);
	});

	function retry() {
		if (!accessToken || !accountId) return;
		void patientWorkspace.reloadList(accessToken, accountId);
	}
</script>

<svelte:head>
	<title>Meus pacientes | Sonnda</title>
	<meta name="description" content="Consulte os pacientes aos quais você tem acesso." />
</svelte:head>

<section aria-labelledby="patients-title">
	<p class="text-sm font-semibold text-brand">Área de trabalho</p>
	<h1 id="patients-title" class="mt-2 text-3xl font-semibold tracking-tight">Meus pacientes</h1>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
		Consulte e selecione os pacientes aos quais você tem acesso.
	</p>

	<Card class="mt-8">
		<label for="patient-search" class="block text-sm font-medium text-on-surface">
			Buscar paciente
		</label>
		<div class="relative mt-2">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-surface-muted"
				aria-hidden="true"
			>
				<path
					d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
			<input
				id="patient-search"
				type="search"
				bind:value={patientWorkspace.query}
				placeholder="Digite o nome do paciente"
				autocomplete="off"
				aria-describedby="patient-search-helper"
				class="w-full rounded-xl border border-border bg-surface py-3 pr-4 pl-12 text-on-surface transition outline-none placeholder:text-on-surface-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
			/>
		</div>
		<p id="patient-search-helper" class="mt-2 text-sm text-on-surface-muted">
			{#if !patientWorkspace.listComplete}
				A busca considera os {patientWorkspace.patients.length} pacientes carregados até agora.
			{:else}
				A busca ignora acentos e diferenças entre maiúsculas e minúsculas.
			{/if}
		</p>
	</Card>

	<section class="mt-6" aria-labelledby="patient-list-title">
		<div class="flex items-end justify-between gap-4">
			<div>
				<h2 id="patient-list-title" class="text-xl font-semibold">Lista de pacientes</h2>
				<p class="mt-1 text-sm text-on-surface-muted">Pacientes aos quais você tem acesso.</p>
			</div>
			<span class="text-sm font-medium text-on-surface-muted">{patientCountLabel}</span>
		</div>

		{#if patientWorkspace.listStatus === 'error'}
			<Alert variant="error" class="mt-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="font-semibold">Não foi possível carregar todos os pacientes.</p>
						{#if patientWorkspace.patients.length > 0}
							<p class="mt-1">A lista abaixo está incompleta.</p>
						{/if}
					</div>
					<Button variant="secondary" size="sm" onclick={retry}>Tentar novamente</Button>
				</div>
			</Alert>
		{/if}

		{#if patientWorkspace.listStatus === 'loading' && patientWorkspace.patients.length === 0}
			<div class="mt-4 grid gap-3" aria-label="Carregando pacientes" aria-busy="true">
				{#each [1, 2, 3] as item (item)}
					<div
						class="flex animate-pulse items-center gap-4 rounded-2xl border border-border bg-surface p-4"
					>
						<div class="size-11 rounded-full bg-surface-muted"></div>
						<div class="h-4 w-48 rounded bg-surface-muted"></div>
					</div>
				{/each}
			</div>
		{:else if patientWorkspace.listComplete && patientWorkspace.total === 0}
			<div
				class="mt-4 grid min-h-56 place-items-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center"
			>
				<div class="max-w-md">
					<h3 class="font-semibold">Nenhum paciente disponível</h3>
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						Sua conta ainda não possui acesso a pacientes.
					</p>
				</div>
			</div>
		{:else if patientWorkspace.listComplete && filteredPatients.length === 0}
			<div
				class="mt-4 grid min-h-44 place-items-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center"
			>
				<div>
					<h3 class="font-semibold">Nenhum resultado encontrado</h3>
					<p class="mt-2 text-sm text-on-surface-muted">Tente buscar por outro nome.</p>
				</div>
			</div>
		{:else if filteredPatients.length > 0}
			<div class="mt-4 grid gap-3">
				{#each filteredPatients as patient (patient.id)}
					{@const initials = patientInitials(patient.full_name)}
					<a
						href={`/patients/${encodeURIComponent(patient.id)}`}
						class="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:border-brand/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{#if patient.avatar_url}
							<img
								src={patient.avatar_url}
								alt=""
								class="size-11 rounded-full bg-surface-muted object-cover"
							/>
						{:else}
							<span
								class="flex size-11 items-center justify-center rounded-full bg-brand-container text-sm font-semibold text-on-brand-container"
								aria-hidden="true"
							>
								{initials}
							</span>
						{/if}
						<span class="min-w-0 flex-1 truncate font-semibold">{patient.full_name}</span>
						<span class="text-sm font-semibold text-brand">Abrir</span>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							class="size-5 text-brand transition group-hover:translate-x-0.5"
							aria-hidden="true"
						>
							<path
								d="m9 18 6-6-6-6"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
				{/each}
			</div>
		{/if}

		{#if patientWorkspace.listStatus === 'loading' && patientWorkspace.patients.length > 0}
			<p class="mt-4 flex items-center gap-2 text-sm text-on-surface-muted" role="status">
				<span
					class="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand"
					aria-hidden="true"
				></span>
				Carregando mais pacientes: {patientWorkspace.patients.length} de {patientWorkspace.total}.
			</p>
		{/if}
	</section>
</section>
