<!-- src/lib/ui/DocumentPreviewCard.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatFileSize } from './formatFileSize.js';

	type Props = {
		name: string;
		mimeType: string;
		sizeBytes?: number;
		createdAt?: string;
		file?: File | null;
		previewUrl?: string | null;
		actions?: Snippet;
		class?: string;
	};

	let {
		name,
		mimeType,
		sizeBytes,
		createdAt,
		file = null,
		previewUrl = null,
		actions,
		class: className = ''
	}: Props = $props();

	let localPreviewUrl = $state<string | null>(null);
	let imageFailed = $state(false);
	let loadedImageUrl = $state<string | null>(null);
	let previousImageUrl: string | null = null;
	const imageUrl = $derived(file ? localPreviewUrl : previewUrl);
	const isImage = $derived(mimeType === 'image/jpeg' || mimeType === 'image/png');
	const kind = $derived(
		mimeType === 'application/pdf'
			? 'PDF'
			: mimeType === 'image/jpeg'
				? 'JPEG'
				: mimeType === 'image/png'
					? 'PNG'
					: 'Arquivo'
	);
	const receivedAt = $derived.by(() => {
		if (!createdAt) return null;
		const date = new Date(createdAt);
		if (Number.isNaN(date.getTime())) return null;
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	});

	$effect(() => {
		if (!file || !isImage) {
			localPreviewUrl = null;
			return;
		}
		const url = URL.createObjectURL(file);
		localPreviewUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	$effect(() => {
		if (imageUrl !== previousImageUrl) {
			previousImageUrl = imageUrl;
			imageFailed = false;
		}
	});

	async function showLoadedImage(event: Event) {
		const image = event.currentTarget as HTMLImageElement;
		const source = imageUrl;
		try {
			await image.decode();
		} catch {
			return;
		}
		if (image.currentSrc === source) loadedImageUrl = source;
	}
</script>

<div class={`flex min-w-0 items-center gap-3 rounded-xl border border-border p-3 ${className}`}>
	<div
		class="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-muted text-on-surface-muted"
	>
		{#if isImage && imageUrl && !imageFailed}
			{#if loadedImageUrl !== imageUrl}
				<svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<rect
						x="3"
						y="4"
						width="18"
						height="16"
						rx="2"
						stroke="currentColor"
						stroke-width="1.6"
					/>
					<circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
					<path
						d="m4 17 5-5 3 3 3-3 5 5"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
			<img
				src={imageUrl}
				alt=""
				class={[
					'absolute inset-0 size-full object-contain',
					loadedImageUrl === imageUrl ? 'opacity-100' : 'opacity-0'
				]}
				loading="lazy"
				onload={showLoadedImage}
				onerror={() => (imageFailed = true)}
			/>
		{:else if mimeType === 'application/pdf'}
			<span class="text-xs font-bold tracking-wide text-brand" aria-hidden="true">PDF</span>
		{:else}
			<svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h4M8.5 15h7M8.5 18h5"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</div>
	<div class="min-w-0 flex-1 text-sm">
		<p class="truncate font-medium" title={name}>{name}</p>
		<p class="mt-1 text-on-surface-muted">
			{kind}{sizeBytes === undefined ? '' : ` · ${formatFileSize(sizeBytes)}`}
		</p>
		{#if receivedAt}
			<p class="mt-1 text-on-surface-muted">
				Recebido em <time datetime={createdAt}>{receivedAt}</time>
			</p>
		{/if}
	</div>
	{@render actions?.()}
</div>
