<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { destroyAuth, initAuth } from '../lib/auth.svelte';
	import './layout.css';

	const { children } = $props();

	onMount(() => {
		void initAuth();
		return destroyAuth;
	});
</script>

{@render children()}
