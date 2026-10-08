<!-- src/lib/ui/Card.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className = '' }: Props = $props();
</script>

<div class={`rounded-2xl border border-border bg-surface p-6 shadow-sm ${className}`}>
	{@render children()}
</div>
