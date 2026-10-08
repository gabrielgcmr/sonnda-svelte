<!-- src/lib/layout/PatientIdentity.svelte -->
<script lang="ts">
	type Props = {
		fullName?: string | null;
		age?: number | null;
		birthDate?: string | null;
		cpf?: string | null;
		cns?: string | null;
		phone?: string | null;
		gender?: string | null;
		race?: string | null;
	};

	let {
		fullName = null,
		age = null,
		birthDate = null,
		cpf = null,
		cns = null,
		phone = null,
		gender = null,
		race = null
	}: Props = $props();

	const valueOrDash = (value: string | number | null | undefined) => value || '—';
</script>

<section class="border-b border-border bg-surface-muted" aria-labelledby="patient-name">
	<div class="mx-auto max-w-6xl px-6 py-5 lg:px-8">
		<div class="flex items-start justify-between gap-8">
			<div class="min-w-0">
				<p class="text-xs font-semibold tracking-wide text-brand uppercase">Paciente</p>
				<h1 id="patient-name" class="mt-1 truncate text-2xl font-semibold tracking-tight">
					{fullName || 'Dados do paciente pendentes'}
				</h1>
			</div>
			{#if !fullName}
				<span
					class="shrink-0 rounded-full bg-warning-container px-3 py-1 text-xs font-semibold text-on-warning-container"
				>
					Integração pendente
				</span>
			{/if}
		</div>

		<dl class="mt-4 flex items-center gap-8 text-sm">
			<div>
				<dt class="text-on-surface-muted">Idade</dt>
				<dd class="mt-1 font-medium text-on-surface">
					{age === null ? '—' : `${age} anos`}
				</dd>
			</div>
			<div>
				<dt class="text-on-surface-muted">Data de nascimento</dt>
				<dd class="mt-1 font-medium text-on-surface">{valueOrDash(birthDate)}</dd>
			</div>
			<div>
				<dt class="text-on-surface-muted">Telefone</dt>
				<dd class="mt-1 font-medium text-on-surface">{valueOrDash(phone)}</dd>
			</div>
		</dl>

		<details class="mt-4 border-t border-border pt-4">
			<summary
				class="w-fit cursor-pointer rounded-md text-sm font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
			>
				Outros dados do cadastro
			</summary>
			<dl class="mt-4 grid grid-cols-4 gap-6 text-sm">
				<div>
					<dt class="text-on-surface-muted">CPF</dt>
					<dd class="mt-1 font-medium text-on-surface">{valueOrDash(cpf)}</dd>
				</div>
				<div>
					<dt class="text-on-surface-muted">CNS</dt>
					<dd class="mt-1 font-medium text-on-surface">{valueOrDash(cns)}</dd>
				</div>
				<div>
					<dt class="text-on-surface-muted">Gênero</dt>
					<dd class="mt-1 font-medium text-on-surface">{valueOrDash(gender)}</dd>
				</div>
				<div>
					<dt class="text-on-surface-muted">Raça/cor</dt>
					<dd class="mt-1 font-medium text-on-surface">{valueOrDash(race)}</dd>
				</div>
			</dl>
		</details>
	</div>
</section>
