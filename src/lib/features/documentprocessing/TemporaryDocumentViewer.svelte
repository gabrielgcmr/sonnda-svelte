<!-- src/lib/features/documentprocessing/TemporaryDocumentViewer.svelte -->
<script lang="ts">
	import type { components } from '#lib/generated/openapi.js';
	import Button from '#lib/ui/Button.svelte';
	import { getTemporaryExtractionPageFile } from './temporaryExtractionApi.js';

	type Page = components['schemas']['TemporaryPage'];
	type Props = {
		extractionId: string;
		pages: Page[];
		accessToken: string | null;
		class?: string;
	};

	let { extractionId, pages, accessToken, class: className = '' }: Props = $props();

	let selected = $state(0);
	let reload = $state(0);
	let brokenRequest = $state<string | null>(null);
	let retriedPage: string | null = null;

	const ordered = $derived([...pages].sort((a, b) => a.position - b.position));
	const index = $derived(Math.min(selected, Math.max(ordered.length - 1, 0)));
	const page = $derived(ordered[index] ?? null);
	const pageKey = $derived(page ? `${extractionId}:${page.position}` : null);
	const requestKey = $derived(`${pageKey}:${reload}`);
	const request = $derived.by(() => {
		if (!accessToken || !page) return null;
		void reload;
		return getTemporaryExtractionPageFile(accessToken, extractionId, page.position).then(
			({ data }) => {
				if (!data?.url) throw new Error('page URL unavailable');
				return data.url;
			}
		);
	});

	function showPage(next: number) {
		selected = Math.min(Math.max(next, 0), ordered.length - 1);
	}

	function retry() {
		brokenRequest = null;
		reload += 1;
	}

	// Signed URLs last a few minutes; an image that fails once gets a fresh URL.
	function onImageError() {
		if (retriedPage === pageKey) {
			brokenRequest = requestKey;
			return;
		}
		retriedPage = pageKey;
		reload += 1;
	}

	async function openInNewTab() {
		if (!accessToken || !page) return;
		const target = window.open('', '_blank');
		if (!target) return;
		target.opener = null;
		try {
			const { data } = await getTemporaryExtractionPageFile(
				accessToken,
				extractionId,
				page.position
			);
			if (data?.url) target.location.href = data.url;
			else target.close();
		} catch {
			target.close();
		}
	}
</script>

{#snippet loadFailure()}
	<div class="p-4 text-center">
		<p class="text-sm text-on-surface-muted">Não foi possível carregar o documento.</p>
		<Button variant="secondary" size="sm" class="mt-3" onclick={retry}>Tentar novamente</Button>
	</div>
{/snippet}

<section class={['flex min-w-0 flex-col', className]} aria-labelledby="document-viewer-title">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h3 id="document-viewer-title" class="font-semibold">Documento</h3>
		{#if ordered.length > 1}
			<div class="flex items-center gap-2 text-sm">
				<Button
					variant="secondary"
					size="sm"
					aria-label="Página anterior"
					disabled={index === 0}
					onclick={() => showPage(index - 1)}>‹</Button
				>
				<span aria-live="polite">Página {index + 1} de {ordered.length}</span>
				<Button
					variant="secondary"
					size="sm"
					aria-label="Próxima página"
					disabled={index === ordered.length - 1}
					onclick={() => showPage(index + 1)}>›</Button
				>
			</div>
		{/if}
	</div>

	<div
		class="mt-3 grid h-[70vh] min-h-96 place-items-center overflow-auto rounded-xl border border-border bg-surface-muted"
	>
		{#if !page || !request}
			<p class="p-4 text-sm text-on-surface-muted">Nenhuma página disponível.</p>
		{:else}
			{#await request}
				<span
					class="block size-8 animate-spin rounded-full border-4 border-brand/25 border-t-brand"
					role="status"
					aria-label="Carregando documento"
				></span>
			{:then url}
				{#if brokenRequest === requestKey}
					{@render loadFailure()}
				{:else if page.mime_type === 'application/pdf'}
					<iframe src={url} title={`Documento: ${page.original_filename}`} class="size-full"
					></iframe>
				{:else}
					<img
						src={url}
						alt={`Página ${index + 1}: ${page.original_filename}`}
						class="max-h-full max-w-full object-contain"
						onload={() => (retriedPage = null)}
						onerror={onImageError}
					/>
				{/if}
			{:catch}
				{@render loadFailure()}
			{/await}
		{/if}
	</div>

	{#if page}
		<div class="mt-2 flex min-w-0 items-center justify-between gap-3 text-xs text-on-surface-muted">
			<span class="truncate" title={page.original_filename}>{page.original_filename}</span>
			<button
				type="button"
				class="shrink-0 font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
				onclick={openInNewTab}
			>
				Abrir em nova aba
			</button>
		</div>
	{/if}
</section>
