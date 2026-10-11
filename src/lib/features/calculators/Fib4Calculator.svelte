<!-- src/lib/features/calculators/Fib4Calculator.svelte -->
<script lang="ts">
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import {
		emptyFib4Values,
		evaluateFib4,
		fib4Fields,
		fib4ResultMatches,
		fib4RiskLabels,
		formatFib4Number,
		validateFib4Form,
		FIB4_HIGH_CUTOFF,
		FIB4_RELIABLE_FROM_AGE,
		type Fib4Field,
		type Fib4FieldErrors,
		type Fib4Result,
		type Fib4Risk
	} from './fib4.js';

	type FieldDefinition = {
		label: string;
		unit: string;
		inputmode: 'numeric' | 'decimal';
		placeholder: string;
	};

	const fieldDefinitions: Record<Fib4Field, FieldDefinition> = {
		age: { label: 'Idade', unit: 'anos', inputmode: 'numeric', placeholder: 'Ex.: 52' },
		ast: { label: 'AST (TGO)', unit: 'U/L', inputmode: 'decimal', placeholder: 'Ex.: 32' },
		alt: { label: 'ALT (TGP)', unit: 'U/L', inputmode: 'decimal', placeholder: 'Ex.: 28' },
		platelets: {
			label: 'Plaquetas',
			unit: '10³/µL',
			inputmode: 'decimal',
			placeholder: 'Ex.: 250'
		}
	};

	const riskTones: Record<Fib4Risk, string> = {
		low: 'bg-success-container text-on-success-container',
		indeterminate: 'bg-warning-container text-on-warning-container',
		high: 'bg-danger-container text-on-danger-container'
	};

	let values = $state({ ...emptyFib4Values });
	let submitted = $state(false);
	let result = $state<Fib4Result | null>(null);
	let inputs = $state<Partial<Record<Fib4Field, HTMLInputElement>>>({});

	const validation = $derived(validateFib4Form(values));
	const errors = $derived<Fib4FieldErrors>(
		submitted && !validation.success ? validation.errors : {}
	);
	const current = $derived(fib4ResultMatches(result, values) ? result : null);
	const stale = $derived(result !== null && current === null);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		const evaluation = evaluateFib4(values);
		if (!evaluation.success) {
			result = null;
			const firstInvalid = fib4Fields.find((field) => evaluation.errors[field]);
			if (firstInvalid) inputs[firstInvalid]?.focus();
			return;
		}
		result = evaluation.result;
	}

	function clearForm() {
		values = { ...emptyFib4Values };
		submitted = false;
		result = null;
		inputs.age?.focus();
	}
</script>

<p class="text-sm font-semibold text-brand">FIB-4</p>
<h2 id="fib4-title" class="mt-2 text-xl font-semibold">Avaliação de fibrose hepática</h2>
<p class="mt-2 text-sm leading-6 text-on-surface-muted">
	Estima o risco de fibrose hepática avançada a partir de idade, AST, ALT e plaquetas.
</p>

<form class="mt-6" aria-labelledby="fib4-title" onsubmit={handleSubmit} novalidate>
	<fieldset class="grid grid-cols-2 gap-5">
		<legend class="sr-only">Dados para o cálculo FIB-4</legend>
		{#each fib4Fields as field (field)}
			{@const definition = fieldDefinitions[field]}
			{@const error = errors[field]}
			<div>
				<label for={`fib4-${field}`} class="mb-2 block text-sm font-medium text-on-surface">
					{definition.label}
					<span class="font-normal text-on-surface-muted">({definition.unit})</span>
					<span class="text-danger" aria-hidden="true"> *</span>
				</label>
				<span class="relative block">
					<input
						bind:this={inputs[field]}
						bind:value={values[field]}
						id={`fib4-${field}`}
						name={field}
						type="text"
						inputmode={definition.inputmode}
						autocomplete="off"
						required
						placeholder={definition.placeholder}
						aria-invalid={error ? 'true' : undefined}
						aria-describedby={error ? `fib4-${field}-error` : undefined}
						class="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-20 text-base text-on-surface transition outline-none placeholder:text-on-surface-muted focus:border-brand focus:ring-4 focus:ring-brand/15"
					/>
					<span
						class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-on-surface-muted"
						aria-hidden="true">{definition.unit}</span
					>
				</span>
				{#if error}
					<p id={`fib4-${field}-error`} class="mt-2 text-sm text-danger">{error}</p>
				{/if}
			</div>
		{/each}
	</fieldset>

	<div class="mt-6 flex flex-wrap gap-3">
		<Button type="submit">Calcular FIB-4</Button>
		<Button variant="secondary" onclick={clearForm}>Limpar</Button>
	</div>
</form>

<div class="mt-6 rounded-xl border border-border bg-surface-muted p-5" aria-live="polite">
	{#if current}
		<p class="text-sm font-semibold text-brand">Resultado</p>
		<div class="mt-2 flex flex-wrap items-center gap-4">
			<strong class="text-4xl font-semibold tracking-tight"
				>{formatFib4Number(current.value)}</strong
			>
			<span class={`rounded-full px-3 py-1 text-sm font-semibold ${riskTones[current.risk]}`}>
				{fib4RiskLabels[current.risk]}
			</span>
		</div>
		<p class="mt-3 text-sm leading-6 text-on-surface-muted">
			Para {current.input.age} anos: abaixo de {formatFib4Number(current.lowCutoff)} indica baixo risco;
			de {formatFib4Number(current.lowCutoff)} a {formatFib4Number(FIB4_HIGH_CUTOFF)}, risco
			indeterminado; acima de {formatFib4Number(FIB4_HIGH_CUTOFF)}, alto risco.
		</p>
		{#if current.input.age < FIB4_RELIABLE_FROM_AGE}
			<Alert variant="warning" class="mt-4">
				O FIB-4 tem menor acurácia em pessoas com menos de {FIB4_RELIABLE_FROM_AGE} anos. Interprete o
				resultado com cautela.
			</Alert>
		{/if}
	{:else if stale}
		<p class="font-medium">Os valores foram alterados</p>
		<p class="mt-1 text-sm leading-6 text-on-surface-muted">
			Calcule novamente para ver o resultado correspondente aos valores atuais.
		</p>
	{:else}
		<p class="font-medium">Nenhum cálculo realizado</p>
		<p class="mt-1 text-sm leading-6 text-on-surface-muted">
			Preencha os quatro campos e selecione “Calcular FIB-4”.
		</p>
	{/if}
</div>

<p class="mt-4 text-xs leading-5 text-on-surface-muted">
	Referência: abaixo de 1,30 baixo risco (abaixo de 2,00 a partir de 65 anos); 1,30 a 2,67
	indeterminado; acima de 2,67 alto risco. O cálculo é feito neste navegador, não é vinculado a
	paciente e não é salvo. Apoio à avaliação; não substitui o julgamento clínico.
</p>
