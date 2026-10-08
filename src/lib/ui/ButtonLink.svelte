<!-- src/lib/ui/ButtonLink.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { buttonClasses, type ButtonSize, type ButtonVariant } from '#lib/ui/buttonStyles.js';

	type Props = Omit<HTMLAnchorAttributes, 'children' | 'class' | 'href'> & {
		children: Snippet;
		href: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
	};

	let {
		children,
		href,
		variant = 'primary',
		size = 'md',
		class: className = '',
		...anchorAttributes
	}: Props = $props();

	const classes = $derived(buttonClasses(variant, size, className));
</script>

<a {...anchorAttributes} {href} class={classes}>
	{@render children()}
</a>
