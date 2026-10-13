<!-- src/lib/features/capture/CaptureInboxItem.svelte -->
<script lang="ts">
	import { writeCaptureDrag } from './captureDrag.js';
	import CapturePreviewCard from './CapturePreviewCard.svelte';
	import type { InboxCapture } from './desktopCapture.svelte.js';

	type Props = { item: InboxCapture; accessToken: string | null };
	let { item, accessToken }: Props = $props();

	function startDrag(event: DragEvent) {
		if (!event.dataTransfer) return;
		writeCaptureDrag(event.dataTransfer, {
			id: item.id,
			name: item.original_filename,
			mimeType: item.mime_type,
			sizeBytes: item.size_bytes,
			createdAt: item.created_at
		});
	}
</script>

<li draggable="true" ondragstart={startDrag} class="cursor-grab active:cursor-grabbing">
	<CapturePreviewCard
		captureId={item.id}
		name={item.original_filename}
		mimeType={item.mime_type}
		sizeBytes={item.size_bytes}
		createdAt={item.created_at}
		{accessToken}
	/>
</li>
