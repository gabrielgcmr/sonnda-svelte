<!-- src/lib/ui/Alert.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type AlertVariant = 'info' | 'success' | 'warning' | 'error';
	type Props = {
		children: Snippet;
		variant?: AlertVariant;
		class?: string;
	};

	let { children, variant = 'info', class: className = '' }: Props = $props();

	const variants: Record<AlertVariant, string> = {
		info: 'border-brand/35 bg-brand-container text-on-brand-container',
		success: 'border-success/35 bg-success-container text-on-success-container',
		warning: 'border-warning/35 bg-warning-container text-on-warning-container',
		error: 'border-danger/35 bg-danger-container text-on-danger-container'
	};
	const role = $derived(variant === 'error' ? 'alert' : 'status');
</script>

<div
	class={`rounded-xl border px-4 py-3 text-sm leading-5 ${variants[variant]} ${className}`}
	{role}
	aria-live="polite"
>
	{@render children()}
</div>
