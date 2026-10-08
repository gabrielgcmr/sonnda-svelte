<!-- src/routes/(app)/home/calculators/+page.svelte -->
<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
</script>

<svelte:head>
	<title>Cálculos clínicos | Sonnda</title>
	<meta
		name="description"
		content="Acesse cálculos clínicos para apoiar a avaliação de pacientes."
	/>
</svelte:head>

<section aria-labelledby="calculators-title">
	<p class="text-sm font-semibold text-brand">Ferramentas</p>
	<h1 id="calculators-title" class="mt-2 text-3xl font-semibold tracking-tight">
		Cálculos clínicos
	</h1>
	<p class="mt-3 max-w-2xl leading-7 text-on-surface-muted">
		Use calculadoras clínicas independentes do cadastro de pacientes.
	</p>

	<div class="mt-8 grid grid-cols-[minmax(0,1fr)_18rem] items-start gap-6">
		<Card>
			<div class="flex items-start justify-between gap-6">
				<div>
					<p class="text-sm font-semibold text-brand">FIB-4</p>
					<h2 class="mt-2 text-xl font-semibold">Avaliação de fibrose hepática</h2>
					<p class="mt-2 text-sm leading-6 text-on-surface-muted">
						Preencha os dados clínicos para calcular o índice.
					</p>
				</div>
				<span
					class="shrink-0 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-on-surface-muted"
				>
					Em breve
				</span>
			</div>

			<fieldset disabled class="mt-6 grid grid-cols-2 gap-5" aria-describedby="fib4-helper">
				<legend class="sr-only">Dados para o cálculo FIB-4</legend>
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-on-surface">Idade</span>
					<span class="relative block">
						<input
							type="number"
							min="18"
							placeholder="0"
							class="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pr-16 text-on-surface outline-none placeholder:text-on-surface-muted disabled:cursor-not-allowed"
						/>
						<span class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-on-surface-muted"
							>anos</span
						>
					</span>
				</label>
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-on-surface">AST (TGO)</span>
					<span class="relative block">
						<input
							type="number"
							min="0"
							placeholder="0"
							class="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pr-16 text-on-surface outline-none placeholder:text-on-surface-muted disabled:cursor-not-allowed"
						/>
						<span class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-on-surface-muted"
							>U/L</span
						>
					</span>
				</label>
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-on-surface">ALT (TGP)</span>
					<span class="relative block">
						<input
							type="number"
							min="0"
							placeholder="0"
							class="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pr-16 text-on-surface outline-none placeholder:text-on-surface-muted disabled:cursor-not-allowed"
						/>
						<span class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-on-surface-muted"
							>U/L</span
						>
					</span>
				</label>
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-on-surface">Plaquetas</span>
					<span class="relative block">
						<input
							type="number"
							min="0"
							placeholder="0"
							class="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pr-24 text-on-surface outline-none placeholder:text-on-surface-muted disabled:cursor-not-allowed"
						/>
						<span class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-on-surface-muted"
							>10³/µL</span
						>
					</span>
				</label>
			</fieldset>
			<p id="fib4-helper" class="mt-3 text-sm text-on-surface-muted">
				O cálculo será habilitado na etapa de implementação do FIB-4.
			</p>
			<button
				type="button"
				disabled
				class="mt-6 inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-surface-strong px-5 py-3 font-semibold text-on-surface-muted"
			>
				Calcular FIB-4
			</button>
		</Card>

		<aside aria-labelledby="calculator-list-title">
			<Card>
				<h2 id="calculator-list-title" class="text-lg font-semibold">Calculadoras</h2>
				<p class="mt-1 text-sm text-on-surface-muted">Selecione o cálculo desejado.</p>
				<div class="mt-5 grid gap-2">
					<button
						type="button"
						aria-pressed="true"
						class="rounded-xl bg-brand-container px-4 py-3 text-left text-sm font-semibold text-on-brand-container"
					>
						FIB-4
					</button>
					<button
						type="button"
						disabled
						class="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-on-surface-muted"
					>
						<span>TFG</span>
						<span class="text-xs">Em breve</span>
					</button>
					<button
						type="button"
						disabled
						class="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-on-surface-muted"
					>
						<span>IMC</span>
						<span class="text-xs">Em breve</span>
					</button>
				</div>
			</Card>
		</aside>
	</div>
</section>
