<!-- src/lib/features/imagingextraction/ImagingReportResult.svelte -->
<script lang="ts">
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { imagingExtractionStatusPresentation, imagingModalityLabel } from './presentation.js';
	import type { ImagingReportResult } from './types.js';

	type CopyState = 'idle' | 'copied' | 'error';
	type Props = {
		result: ImagingReportResult;
		copyState: CopyState;
		onCopy: () => void;
		onStartOver: () => void;
	};

	let { result, copyState, onCopy, onStartOver }: Props = $props();
	const status = $derived(imagingExtractionStatusPresentation(result.status));
	const report = $derived(result.report);
	const badgeClasses = $derived(
		status.variant === 'success'
			? 'bg-success-container text-on-success-container'
			: status.variant === 'warning'
				? 'bg-warning-container text-on-warning-container'
				: 'bg-brand-container text-on-brand-container'
	);
	const metadata = $derived(
		[
			{ label: 'Exame', value: report.exam_name },
			{ label: 'Região anatômica', value: report.body_region },
			{ label: 'Data', value: formatImagingDate(report.exam_date) },
			{ label: 'Modalidade', value: imagingModalityLabel(report.modality) }
		].filter((item): item is { label: string; value: string } => Boolean(item.value))
	);

	function formatImagingDate(value: string | null) {
		if (!value) return null;
		const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
		if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? value
			: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(parsed);
	}
</script>

<div class="min-w-0 [overflow-wrap:anywhere]" aria-live="polite">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-sm font-semibold text-brand">Resultado</p>
			<h2 class="mt-2 text-lg font-semibold">Laudo de imagem extraído</h2>
		</div>
		<span class={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
			{status.label}
		</span>
	</div>

	{#if result.warnings?.length}
		<Alert variant="warning" class="mt-5">
			<p class="font-semibold">Confira estes pontos</p>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				{#each result.warnings as warning (warning.code)}
					<li>{warning.message}</li>
				{/each}
			</ul>
		</Alert>
	{/if}

	<section
		class="mt-5 rounded-xl border border-border bg-surface-muted p-4"
		aria-labelledby="imaging-summary-title"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h3 id="imaging-summary-title" class="font-semibold">Resumo</h3>
			<Button variant="secondary" size="sm" onclick={onCopy} disabled={!result.summary_text.trim()}>
				{copyState === 'copied' ? 'Copiado' : 'Copiar resumo'}
			</Button>
		</div>
		<p class="mt-3 max-w-prose text-sm leading-6 whitespace-pre-wrap text-on-surface">
			{result.summary_text || 'Nenhum resumo textual foi produzido.'}
		</p>
		{#if copyState === 'error'}
			<p class="mt-2 text-sm text-danger" role="alert">Não foi possível copiar o resumo.</p>
		{/if}
	</section>

	{#if metadata.length}
		<dl class="mt-6 grid gap-4 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
			{#each metadata as item (item.label)}
				<div>
					<dt class="text-on-surface-muted">{item.label}</dt>
					<dd class="mt-1 font-medium">{item.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#if report.technique_text}
		<section class="mt-6" aria-labelledby="imaging-technique-title">
			<h3 id="imaging-technique-title" class="font-semibold">Técnica</h3>
			<p class="mt-2 text-sm leading-6 whitespace-pre-wrap">{report.technique_text}</p>
		</section>
	{/if}
	{#if report.findings_text}
		<section class="mt-6" aria-labelledby="imaging-findings-title">
			<h3 id="imaging-findings-title" class="font-semibold">Achados</h3>
			<p class="mt-2 text-sm leading-6 whitespace-pre-wrap">{report.findings_text}</p>
		</section>
	{/if}
	{#if report.impression_text}
		<section class="mt-6" aria-labelledby="imaging-impression-title">
			<h3 id="imaging-impression-title" class="font-semibold">Conclusão</h3>
			<p class="mt-2 text-sm leading-6 whitespace-pre-wrap">{report.impression_text}</p>
		</section>
	{/if}

	{#if report.classifications?.length}
		<section class="mt-6" aria-labelledby="imaging-classifications-title">
			<h3 id="imaging-classifications-title" class="font-semibold">Classificações identificadas</h3>
			<ul class="mt-3 space-y-3">
				{#each report.classifications as classification, index (`${classification.system}-${index}`)}
					<li class="rounded-xl border border-border p-4 text-sm">
						<p class="font-medium">{classification.system}: {classification.value}</p>
						<p class="mt-2 text-on-surface-muted">Trecho de origem: {classification.source_text}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if report.measurements?.length}
		<section class="mt-6" aria-labelledby="imaging-measurements-title">
			<h3 id="imaging-measurements-title" class="font-semibold">Medidas identificadas</h3>
			<ul class="mt-3 space-y-3">
				{#each report.measurements as measurement, index (`${measurement.name}-${index}`)}
					<li class="rounded-xl border border-border p-4 text-sm">
						<p class="font-medium">
							{measurement.name}{#if measurement.location}
								· {measurement.location}{/if}:
							{measurement.value_text}{#if measurement.unit}
								{measurement.unit}{/if}
						</p>
						<p class="mt-2 text-on-surface-muted">Trecho de origem: {measurement.source_text}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="mt-6 flex justify-end border-t border-border pt-5">
		<Button variant="secondary" onclick={onStartOver}>Nova extração</Button>
	</div>
</div>
