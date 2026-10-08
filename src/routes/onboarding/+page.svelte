<!-- src/routes/onboarding/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { currentAccount } from '#lib/features/account/account.svelte.js';
	import type { AccountProblem } from '#lib/features/account/types.js';
	import { auth, signOut } from '#lib/features/auth/auth.svelte.js';
	import {
		validateOnboardingForm,
		type OnboardingField,
		type OnboardingFieldErrors
	} from '#lib/features/onboarding/form.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import Card from '#lib/ui/Card.svelte';
	import TextField from '#lib/ui/TextField.svelte';
	import ThemeToggle from '#lib/ui/ThemeToggle.svelte';

	let fullName = $state('');
	let birthDate = $state('');
	let cpf = $state('');
	let phone = $state('');
	let errors = $state<OnboardingFieldErrors>({});
	let formProblem = $state<AccountProblem | null>(null);
	let loggingOut = $state(false);
	let logoutError = $state<string | null>(null);
	let initializedAccountId = $state<string | null>(null);

	const today = new Date();
	const maxBirthDate = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, '0'),
		String(today.getDate()).padStart(2, '0')
	].join('-');

	$effect(() => {
		const account = currentAccount.account;
		if (!account || account.id === initializedAccountId) return;

		initializedAccountId = account.id;
		fullName = account.profile.full_name ?? '';
		birthDate = account.profile.birth_date ?? '';
		cpf = account.profile.cpf ?? '';
		phone = account.profile.phone ?? '';
	});

	function problemMessage(problem: AccountProblem) {
		return problem.detail || problem.title || 'Não foi possível salvar seus dados agora.';
	}

	function clearFieldError(field: OnboardingField) {
		if (!errors[field]) return;

		const nextErrors = { ...errors };
		delete nextErrors[field];
		errors = nextErrors;
	}

	async function focusFirstError() {
		await tick();
		const firstField = (Object.keys(errors) as OnboardingField[])[0];
		if (firstField) document.getElementById(`onboarding-${firstField}`)?.focus();
	}

	async function retryAccount() {
		if (!auth.session || currentAccount.status === 'loading') return;
		await currentAccount.load(auth.session.access_token);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!auth.session || currentAccount.saving) return;

		formProblem = null;
		errors = {};

		const result = validateOnboardingForm({ fullName, birthDate, cpf, phone });
		if (!result.success) {
			errors = result.errors;
			await focusFirstError();
			return;
		}

		await currentAccount.updateProfile(auth.session.access_token, result.input);

		if (currentAccount.problem) {
			formProblem = currentAccount.problem;
			return;
		}

		const account = currentAccount.account;
		if (account?.onboarding_completed) {
			await goto('/home');
			return;
		}

		if (!account?.profile.full_name?.trim()) {
			errors.fullName = 'O nome completo ainda precisa ser informado.';
		}
		if (!account?.profile.birth_date) {
			errors.birthDate = 'A data de nascimento ainda precisa ser informada.';
		}

		formProblem = {
			type: 'about:blank',
			title: 'Seu cadastro ainda está incompleto.',
			detail:
				Object.keys(errors).length > 0
					? 'Revise os campos destacados para continuar.'
					: 'Confira os dados informados e tente novamente.'
		};
		await focusFirstError();
	}

	async function handleSignOut() {
		if (loggingOut || currentAccount.saving) return;

		logoutError = null;
		loggingOut = true;

		try {
			await signOut();
			await goto('/login');
		} catch {
			logoutError = 'Não foi possível sair agora. Tente novamente.';
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Complete seu cadastro | Sonnda</title>
	<meta name="description" content="Complete as informações essenciais do seu perfil no Sonnda." />
</svelte:head>

<main class="min-h-screen bg-canvas text-on-canvas">
	<header class="border-b border-border bg-surface">
		<div
			class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
		>
			<span class="text-sm font-bold tracking-[0.22em] text-brand uppercase">Sonnda</span>

			<div class="flex items-center gap-2 sm:gap-3">
				<ThemeToggle />
				{#if auth.session}
					<Button
						variant="secondary"
						size="sm"
						onclick={handleSignOut}
						loading={loggingOut}
						disabled={currentAccount.saving}
					>
						{loggingOut ? 'Saindo...' : 'Sair'}
					</Button>
				{/if}
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		{#if !auth.ready || currentAccount.status === 'loading'}
			<section class="mx-auto max-w-2xl" aria-label="Carregando seu cadastro" aria-busy="true">
				<div class="h-4 w-28 animate-pulse rounded-full bg-surface-muted"></div>
				<div class="mt-4 h-10 w-3/4 animate-pulse rounded-xl bg-surface-muted"></div>
				<div class="mt-8 h-96 animate-pulse rounded-2xl border border-border bg-surface"></div>
			</section>
		{:else if !auth.session}
			<section class="mx-auto max-w-xl py-16 text-center" aria-labelledby="session-title">
				<h1 id="session-title" class="text-3xl font-semibold tracking-tight">
					Entre para completar seu cadastro
				</h1>
				<p class="mt-3 leading-7 text-on-surface-muted">
					Sua sessão não está ativa. Entre novamente para continuar de onde parou.
				</p>
				<ButtonLink href="/login" class="mt-7">Ir para o login</ButtonLink>
			</section>
		{:else if currentAccount.status === 'error' || !currentAccount.account}
			<section class="mx-auto max-w-xl py-16 text-center" aria-labelledby="account-error-title">
				<h1 id="account-error-title" class="text-3xl font-semibold tracking-tight">
					Não foi possível carregar seu cadastro
				</h1>
				<p class="mt-3 leading-7 text-on-surface-muted">
					Verifique sua conexão e tente buscar os dados da conta novamente.
				</p>
				{#if currentAccount.problem}
					<Alert variant="error" class="mt-6 text-left">
						{problemMessage(currentAccount.problem)}
					</Alert>
				{/if}
				<Button onclick={retryAccount} class="mt-7">Tentar novamente</Button>
			</section>
		{:else}
			<div class="grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
				<section aria-labelledby="onboarding-title" class="lg:sticky lg:top-8">
					<p class="text-sm font-semibold text-brand">Seu perfil</p>
					<h1 id="onboarding-title" class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
						Complete seu cadastro
					</h1>
					<p class="mt-4 leading-7 text-on-surface-muted">
						Precisamos apenas das informações essenciais para preparar sua experiência no Sonnda.
						Você poderá atualizar esses dados mais tarde.
					</p>

					<div class="mt-7 rounded-2xl bg-brand-container p-5 text-on-brand-container">
						<p class="font-semibold">O que é obrigatório?</p>
						<p class="mt-2 text-sm leading-6">
							Somente seu nome completo e sua data de nascimento. CPF e telefone são opcionais.
						</p>
					</div>
				</section>

				<Card class="p-5 sm:p-8">
					<form class="space-y-5" onsubmit={handleSubmit} novalidate>
						<TextField
							id="onboarding-fullName"
							name="full_name"
							label="Nome completo"
							bind:value={fullName}
							autocomplete="name"
							placeholder="Como você gostaria de ser chamado"
							minlength={2}
							maxlength={120}
							required
							error={errors.fullName}
							disabled={currentAccount.saving}
							oninput={() => clearFieldError('fullName')}
						/>

						<TextField
							id="onboarding-birthDate"
							name="birth_date"
							label="Data de nascimento"
							type="date"
							bind:value={birthDate}
							autocomplete="bday"
							max={maxBirthDate}
							required
							error={errors.birthDate}
							disabled={currentAccount.saving}
							oninput={() => clearFieldError('birthDate')}
						/>

						<div class="grid gap-5 sm:grid-cols-2">
							<TextField
								id="onboarding-cpf"
								name="cpf"
								label="CPF (opcional)"
								bind:value={cpf}
								inputmode="numeric"
								placeholder="000.000.000-00"
								helper="Somente 11 dígitos quando preenchido."
								error={errors.cpf}
								disabled={currentAccount.saving}
								oninput={() => clearFieldError('cpf')}
							/>

							<TextField
								id="onboarding-phone"
								name="phone"
								label="Telefone (opcional)"
								type="tel"
								bind:value={phone}
								autocomplete="tel"
								inputmode="tel"
								placeholder="+55 (11) 99999-9999"
								helper="Entre 10 e 15 dígitos, com + opcional."
								error={errors.phone}
								disabled={currentAccount.saving}
								oninput={() => clearFieldError('phone')}
							/>
						</div>

						{#if formProblem}
							<Alert variant="error">{problemMessage(formProblem)}</Alert>
						{/if}

						{#if logoutError}
							<Alert variant="error">{logoutError}</Alert>
						{/if}

						<Button type="submit" loading={currentAccount.saving} class="w-full">
							{currentAccount.saving ? 'Salvando...' : 'Salvar e continuar'}
						</Button>

						<p class="text-center text-xs leading-5 text-on-surface-muted">
							Ao continuar, seus dados serão enviados com segurança para completar seu perfil.
						</p>
					</form>
				</Card>
			</div>
		{/if}
	</div>
</main>
