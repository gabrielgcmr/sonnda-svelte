<!-- src/lib/features/labextraction/LabExtractionResult.svelte -->
<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import Alert from '#lib/ui/Alert.svelte';
	import { extractionStatusPresentation, formatExtractedDate } from './presentation.js';
	import type { LabExtractionResult } from './types.js';

	type CopyState = 'idle' | 'copied' | 'error';
	type Props = {
		result: LabExtractionResult;
		copyState: CopyState;
		onCopy: () => void;
		onStartOver: () => void;
	};

	let { result, copyState, onCopy, onStartOver }: Props = $props();
	const status = $derived(extractionStatusPresentation(result.status));
	const tests = $derived(result.report.tests ?? []);
	const metadata = $derived(
		[
			{ label: 'Paciente', value: result.report.patient_name },
			{ label: 'Nascimento', value: formatExtractedDate(result.report.patient_dob) },
			{ label: 'Laboratório', value: result.report.lab_name },
			{ label: 'Telefone do laboratório', value: result.report.lab_phone },
			{ label: 'Convênio', value: result.report.insurance_provider },
			{ label: 'Data do laudo', value: formatExtractedDate(result.report.report_date) },
			{ label: 'Médico solicitante', value: result.report.requesting_doctor },
			{ label: 'Responsável técnico', value: result.report.technical_manager }
		].filter((item): item is { label: string; value: string } => Boolean(item.value))
	);

	const badgeClasses = $derived(
		status.variant === 'success'
			? 'bg-success-container text-on-success-container'
			: status.variant === 'warning'
				? 'bg-warning-container text-on-warning-container'
				: status.variant === 'error'
					? 'bg-danger-container text-on-danger-container'
					: 'bg-brand-container text-on-brand-container'
	);
</script>

<div aria-live="polite">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-sm font-semibold text-brand">Resultado</p>
			<h2 class="mt-2 text-lg font-semibold">Resumo extraído</h2>
		</div>
		<span class={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
			{status.label}
		</span>
	</div>

	{#if result.warnings?.length}
		<Alert variant="warning" class="mt-5">
			<p class="font-semibold">Confira estes pontos</p>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				{#each result.warnings as warning, index (`${warning.code}-${warning.field ?? ''}-${index}`)}
					<li>
						{warning.message}{#if warning.field}
							<span class="opacity-75"> ({warning.field})</span>
						{/if}
					</li>
				{/each}
			</ul>
		</Alert>
	{/if}

	<section
		class="mt-5 rounded-xl border border-border bg-surface-muted p-4"
		aria-labelledby="summary-title"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h3 id="summary-title" class="font-semibold">Resumo</h3>
			<Button variant="secondary" size="sm" onclick={onCopy} disabled={!result.summary_text.trim()}>
				{copyState === 'copied' ? 'Copiado' : 'Copiar resumo'}
			</Button>
		</div>
		<p class="mt-3 text-sm leading-6 whitespace-pre-wrap text-on-surface">
			{result.summary_text || 'Nenhum resumo textual foi produzido.'}
		</p>
		{#if copyState === 'error'}
			<p class="mt-2 text-sm text-danger" role="alert">Não foi possível copiar o resumo.</p>
		{/if}
	</section>

	{#if metadata.length}
		<section class="mt-6" aria-labelledby="report-data-title">
			<h3 id="report-data-title" class="font-semibold">Dados identificados no laudo</h3>
			<dl class="mt-3 grid gap-4 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
				{#each metadata as item (item.label)}
					<div>
						<dt class="text-on-surface-muted">{item.label}</dt>
						<dd class="mt-1 font-medium text-on-surface">{item.value}</dd>
					</div>
				{/each}
			</dl>
		</section>
	{/if}

	<section class="mt-6" aria-labelledby="structured-results-title">
		<h3 id="structured-results-title" class="font-semibold">Resultados estruturados</h3>
		{#if tests.length === 0}
			<p
				class="mt-3 rounded-xl border border-dashed border-border-strong p-4 text-sm text-on-surface-muted"
			>
				Nenhum resultado laboratorial estruturado foi identificado.
			</p>
		{:else}
			<div class="mt-3 space-y-4">
				{#each tests as test, testIndex (`${test.test_name}-${testIndex}`)}
					<article class="overflow-hidden rounded-xl border border-border">
						<div class="bg-surface-muted px-4 py-3">
							<h4 class="font-semibold">{test.test_name}</h4>
							{#if test.material || test.method || test.collected_at || test.release_at}
								<p class="mt-1 text-xs leading-5 text-on-surface-muted">
									{[
										test.material ? `Material: ${test.material}` : null,
										test.method ? `Método: ${test.method}` : null,
										test.collected_at ? `Coleta: ${formatExtractedDate(test.collected_at)}` : null,
										test.release_at ? `Liberação: ${formatExtractedDate(test.release_at)}` : null
									]
										.filter(Boolean)
										.join(' · ')}
								</p>
							{/if}
						</div>
						{#if test.items?.length}
							<div class="overflow-x-auto">
								<table class="w-full min-w-lg text-left text-sm">
									<thead class="border-y border-border text-xs text-on-surface-muted">
										<tr>
											<th class="px-4 py-2 font-medium">Parâmetro</th>
											<th class="px-4 py-2 font-medium">Resultado</th>
											<th class="px-4 py-2 font-medium">Referência</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										{#each test.items as item, itemIndex (`${item.parameter_name}-${itemIndex}`)}
											<tr>
												<td class="px-4 py-3 font-medium">{item.parameter_name}</td>
												<td class="px-4 py-3">
													{item.result_value ?? '—'}{#if item.result_unit}
														{` ${item.result_unit}`}
													{/if}
												</td>
												<td class="px-4 py-3 text-on-surface-muted">{item.reference_text ?? '—'}</td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="px-4 py-4 text-sm text-on-surface-muted">Nenhum parâmetro identificado.</p>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<div class="mt-6 flex justify-end border-t border-border pt-5">
		<Button variant="secondary" onclick={onStartOver}>Nova extração</Button>
	</div>
</div>
