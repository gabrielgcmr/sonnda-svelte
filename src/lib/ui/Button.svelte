<!-- src/lib/ui/Button.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { buttonClasses, type ButtonSize, type ButtonVariant } from '#lib/ui/buttonStyles.js';

	type Props = Omit<
		HTMLButtonAttributes,
		'aria-busy' | 'children' | 'class' | 'disabled' | 'type'
	> & {
		children: Snippet;
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
	};

	let {
		children,
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		class: className = '',
		...buttonAttributes
	}: Props = $props();

	const classes = $derived(buttonClasses(variant, size, className));
</script>

<button
	{...buttonAttributes}
	class={classes}
	{type}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
>
	{#if loading}
		<span
			class="size-5 animate-spin rounded-full border-2 border-current/35 border-t-current"
			aria-hidden="true"
		></span>
	{/if}
	{@render children()}
</button>
