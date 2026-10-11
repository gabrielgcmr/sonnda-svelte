<!-- src/routes/(app)/home/calculators/+page.svelte -->
<script lang="ts">
	import Fib4Calculator from '#lib/features/calculators/Fib4Calculator.svelte';
	import {
		calculators,
		defaultCalculatorId,
		type CalculatorId
	} from '#lib/features/calculators/registry.js';
	import Card from '#lib/ui/Card.svelte';

	let selectedId = $state<CalculatorId>(defaultCalculatorId);
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
			{#if selectedId === 'fib4'}
				<Fib4Calculator />
			{/if}
		</Card>

		<aside aria-labelledby="calculator-list-title">
			<Card>
				<h2 id="calculator-list-title" class="text-lg font-semibold">Calculadoras</h2>
				<p class="mt-1 text-sm text-on-surface-muted">Selecione o cálculo desejado.</p>
				<div class="mt-5 grid gap-2">
					{#each calculators as calculator (calculator.id)}
						{#if calculator.available}
							<button
								type="button"
								aria-pressed={selectedId === calculator.id}
								onclick={() => (selectedId = calculator.id)}
								class={[
									'rounded-xl px-4 py-3 text-left text-sm font-semibold transition',
									selectedId === calculator.id
										? 'bg-brand-container text-on-brand-container'
										: 'text-on-surface hover:bg-surface-muted'
								]}
							>
								{calculator.label}
							</button>
						{:else}
							<button
								type="button"
								disabled
								class="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-on-surface-muted"
							>
								<span>{calculator.label}</span>
								<span class="text-xs">Em breve</span>
							</button>
						{/if}
					{/each}
				</div>
			</Card>
		</aside>
	</div>
</section>
