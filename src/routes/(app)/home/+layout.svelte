<!-- src/routes/(app)/home/+layout.svelte -->
<script lang="ts">
	import UserNavigation from '#lib/layout/UserNavigation.svelte';

	const { children } = $props();
</script>

<UserNavigation />
<main class="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
	{@render children()}
</main>
