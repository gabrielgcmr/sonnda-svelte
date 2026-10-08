<!-- src/lib/ui/Button.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost';
	type ButtonSize = 'sm' | 'md';

	type Props = {
		children: Snippet;
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		'aria-label'?: string;
	};

	let {
		children,
		variant = 'primary',
		size = 'md',
		type = 'button',
		href,
		disabled = false,
		loading = false,
		class: className = '',
		onclick,
		'aria-label': ariaLabel
	}: Props = $props();

	const variants: Record<ButtonVariant, string> = {
		primary:
			'border-transparent bg-brand text-on-brand hover:brightness-95 focus-visible:outline-brand disabled:bg-surface-strong disabled:text-on-surface-muted',
		secondary:
			'border-border bg-surface text-on-surface hover:border-border-strong hover:bg-surface-muted focus-visible:outline-brand',
		ghost:
			'border-transparent bg-transparent text-brand hover:bg-brand-container hover:text-on-brand-container focus-visible:outline-brand'
	};
	const sizes: Record<ButtonSize, string> = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-5 py-3'
	};
	const classes = $derived(
		`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${className}`
	);
</script>

{#if href}
	<a class={classes} {href} aria-label={ariaLabel} {onclick}>
		{@render children()}
	</a>
{:else}
	<button
		class={classes}
		{type}
		disabled={disabled || loading}
		aria-busy={loading}
		aria-label={ariaLabel}
		{onclick}
	>
		{#if loading}
			<span
				class="size-5 animate-spin rounded-full border-2 border-current/35 border-t-current"
				aria-hidden="true"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
