<!-- src/routes/(app)/patients/new/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import { auth } from '#lib/features/auth/auth.svelte.js';
	import {
		patientGenderOptions,
		patientRaceOptions,
		validateCreatePatientForm,
		type CreatePatientField,
		type CreatePatientFieldErrors
	} from '#lib/features/patient/createForm.js';
	import RelationField from '#lib/features/patient/RelationField.svelte';
	import { patientWorkspace } from '#lib/features/patient/patientWorkspace.svelte.js';
	import type { PatientProblem } from '#lib/features/patient/types.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import Card from '#lib/ui/Card.svelte';
	import SelectField from '#lib/ui/SelectField.svelte';
	import TextField from '#lib/ui/TextField.svelte';

	let fullName = $state('');
	let birthDate = $state('');
	let cpf = $state('');
	let cns = $state('');
	let phone = $state('');
	let gender = $state('');
	let race = $state('');
	let relationType = $state('');
	let errors = $state<CreatePatientFieldErrors>({});
	let formProblem = $state<PatientProblem | null>(null);
	const allowProfessionalRelation = $derived(
		currentAccount.account?.account_type === 'professional'
	);

	const today = new Date();
	const maxBirthDate = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, '0'),
		String(today.getDate()).padStart(2, '0')
	].join('-');

	function clearFieldError(field: CreatePatientField) {
		if (!errors[field]) return;
		const nextErrors = { ...errors };
		delete nextErrors[field];
		errors = nextErrors;
	}

	async function focusFirstError() {
		await tick();
		const firstField = (Object.keys(errors) as CreatePatientField[])[0];
		if (firstField) document.getElementById(`patient-${firstField}`)?.focus();
	}

	function problemMessage(problem: PatientProblem) {
		if (problem.status === 409) return 'Já existe um paciente cadastrado com este CPF.';
		return problem.detail || problem.title || 'Não foi possível cadastrar o paciente agora.';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const accessToken = auth.session?.access_token;
		const accountId = currentAccount.account?.id;
		if (!accessToken || !accountId || patientWorkspace.creating) return;

		formProblem = null;
		errors = {};
		const result = validateCreatePatientForm(
			{
				fullName,
				birthDate,
				cpf,
				cns,
				phone,
				gender,
				race,
				relationType
			},
			new Date(),
			{ allowProfessional: allowProfessionalRelation }
		);
		if (!result.success) {
			errors = result.errors;
			await focusFirstError();
			return;
		}

		const patientId = await patientWorkspace.create(accessToken, accountId, result.input);
		if (!patientId) {
			formProblem = patientWorkspace.createProblem;
			return;
		}

		await goto(`/patients/${encodeURIComponent(patientId)}`);
	}
</script>

<svelte:head>
	<title>Adicionar paciente | Sonnda</title>
	<meta name="description" content="Cadastre um paciente e defina seu vínculo inicial." />
</svelte:head>

<main class="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
	<section aria-labelledby="create-patient-title">
		<p class="text-sm font-semibold text-brand">Meus pacientes</p>
		<h1 id="create-patient-title" class="mt-2 text-3xl font-semibold tracking-tight">
			Adicionar paciente
		</h1>
		<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
			Cadastre os dados essenciais e informe qual é o seu vínculo com o paciente.
		</p>

		<div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<Card class="p-5 sm:p-8">
				<form class="space-y-6" onsubmit={handleSubmit} novalidate>
					<section aria-labelledby="patient-profile-fields">
						<h2 id="patient-profile-fields" class="text-lg font-semibold">Dados do paciente</h2>
						<div class="mt-5 space-y-5">
							<TextField
								id="patient-fullName"
								name="full_name"
								label="Nome completo"
								bind:value={fullName}
								autocomplete="name"
								minlength={2}
								maxlength={120}
								required
								error={errors.fullName}
								disabled={patientWorkspace.creating}
								oninput={() => clearFieldError('fullName')}
							/>

							<div class="grid gap-5 sm:grid-cols-2">
								<TextField
									id="patient-birthDate"
									name="birth_date"
									label="Data de nascimento"
									type="date"
									bind:value={birthDate}
									autocomplete="bday"
									max={maxBirthDate}
									required
									error={errors.birthDate}
									disabled={patientWorkspace.creating}
									oninput={() => clearFieldError('birthDate')}
								/>
								<TextField
									id="patient-cpf"
									name="cpf"
									label="CPF"
									bind:value={cpf}
									inputmode="numeric"
									placeholder="000.000.000-00"
									required
									error={errors.cpf}
									disabled={patientWorkspace.creating}
									oninput={() => clearFieldError('cpf')}
								/>
							</div>

							<div class="grid gap-5 sm:grid-cols-2">
								<SelectField
									id="patient-gender"
									name="gender"
									label="Gênero"
									options={patientGenderOptions}
									bind:value={gender}
									required
									error={errors.gender}
									disabled={patientWorkspace.creating}
									onchange={() => clearFieldError('gender')}
								/>
								<SelectField
									id="patient-race"
									name="race"
									label="Raça/cor"
									options={patientRaceOptions}
									bind:value={race}
									required
									error={errors.race}
									disabled={patientWorkspace.creating}
									onchange={() => clearFieldError('race')}
								/>
							</div>

							<div class="grid gap-5 sm:grid-cols-2">
								<TextField
									id="patient-cns"
									name="cns"
									label="CNS (opcional)"
									bind:value={cns}
									inputmode="numeric"
									placeholder="000 0000 0000 0000"
									helper="Cartão Nacional de Saúde com 15 dígitos."
									error={errors.cns}
									disabled={patientWorkspace.creating}
									oninput={() => clearFieldError('cns')}
								/>
								<TextField
									id="patient-phone"
									name="phone"
									label="Telefone (opcional)"
									type="tel"
									bind:value={phone}
									autocomplete="tel"
									placeholder="+55 (11) 99999-9999"
									error={errors.phone}
									disabled={patientWorkspace.creating}
									oninput={() => clearFieldError('phone')}
								/>
							</div>
						</div>
					</section>

					<section class="border-t border-border pt-6" aria-labelledby="patient-access-fields">
						<h2 id="patient-access-fields" class="text-lg font-semibold">Acesso inicial</h2>
						<div class="mt-5">
							<RelationField
								id="patient-relationType"
								name="relation_type"
								bind:value={relationType}
								allowProfessional={allowProfessionalRelation}
								error={errors.relationType}
								disabled={patientWorkspace.creating}
								onchange={() => clearFieldError('relationType')}
							/>
						</div>
					</section>

					{#if formProblem}
						<Alert variant="error">{problemMessage(formProblem)}</Alert>
					{/if}

					<div class="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
						<ButtonLink href="/home" variant="secondary">Cancelar</ButtonLink>
						<Button type="submit" loading={patientWorkspace.creating}>
							{patientWorkspace.creating ? 'Cadastrando...' : 'Cadastrar paciente'}
						</Button>
					</div>
				</form>
			</Card>

			<aside class="space-y-4 lg:sticky lg:top-6" aria-label="Orientações do cadastro">
				<div class="rounded-2xl bg-brand-container p-5 text-on-brand-container">
					<h2 class="font-semibold">Depois do cadastro</h2>
					<p class="mt-2 text-sm leading-6">
						O paciente será aberto automaticamente e ficará disponível em Meus pacientes.
					</p>
				</div>
				<div
					class="rounded-2xl border border-border bg-surface p-5 text-sm leading-6 text-on-surface-muted"
				>
					<p class="font-semibold text-on-surface">Campos obrigatórios</p>
					<p class="mt-2">Nome, nascimento, CPF, gênero, raça/cor e vínculo.</p>
				</div>
			</aside>
		</div>
	</section>
</main>
