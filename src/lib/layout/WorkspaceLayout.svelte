<!-- src/lib/layout/WorkspaceLayout.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { children: Snippet; left?: Snippet; right?: Snippet };
	let { children, left, right }: Props = $props();
</script>

<div class="flex w-full min-w-0 items-start gap-6">
	{#if left}
		<div class="sticky top-6 shrink-0">{@render left()}</div>
	{/if}
	<div class="@container/workspace min-w-0 flex-1">{@render children()}</div>
	{#if right}
		<div class="sticky top-6 shrink-0">{@render right()}</div>
	{/if}
</div>
