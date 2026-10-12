<!-- src/routes/(app)/home/+layout.svelte -->
<script lang="ts">
	const { children } = $props();
</script>

<main class="w-full min-w-0 py-4">
	{@render children()}
</main>
