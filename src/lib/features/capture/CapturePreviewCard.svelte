<!-- src/lib/features/capture/CapturePreviewCard.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import DocumentPreviewCard from '#lib/ui/DocumentPreviewCard.svelte';
	import { getInboxCaptureFile } from './desktopCaptureApi.js';

	type Props = {
		captureId: string;
		name: string;
		mimeType: string;
		sizeBytes?: number;
		createdAt?: string;
		accessToken: string | null;
		actions?: Snippet;
		class?: string;
	};

	let {
		captureId,
		name,
		mimeType,
		sizeBytes,
		createdAt,
		accessToken,
		actions,
		class: className = ''
	}: Props = $props();
	let previewUrl = $state<string | null>(null);

	$effect(() => {
		const id = captureId;
		const token = accessToken;
		const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png';
		previewUrl = null;
		if (!token || !isImage) return;
		let active = true;
		void getInboxCaptureFile(token, id)
			.then(({ data }) => {
				if (active) previewUrl = data?.url ?? null;
			})
			.catch(() => {
				if (active) previewUrl = null;
			});
		return () => {
			active = false;
		};
	});
</script>

<DocumentPreviewCard
	{name}
	{mimeType}
	{sizeBytes}
	{createdAt}
	{previewUrl}
	{actions}
	class={className}
/>
