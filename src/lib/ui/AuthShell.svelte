<!-- src/lib/ui/AuthShell.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from './Card.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	type Props = {
		titleId: string;
		asideTitle: string;
		asideDescription: string;
		eyebrow: string;
		title: string;
		description?: string;
		children: Snippet;
		footer?: Snippet;
	};

	let {
		titleId,
		asideTitle,
		asideDescription,
		eyebrow,
		title,
		description,
		children,
		footer
	}: Props = $props();
</script>

<main class="relative min-h-screen bg-canvas px-4 py-10 text-on-canvas sm:px-6 lg:px-8">
	<div class="absolute top-4 right-4 sm:top-6 sm:right-6">
		<ThemeToggle />
	</div>

	<div class="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-2">
		<section class="hidden lg:block" aria-labelledby={`${titleId}-welcome`}>
			<p class="mb-5 text-sm font-semibold tracking-[0.22em] text-brand uppercase">Sonnda</p>
			<h1
				id={`${titleId}-welcome`}
				class="max-w-xl text-5xl leading-[1.08] font-semibold tracking-tight"
			>
				{asideTitle}
			</h1>
			<p class="mt-6 max-w-lg text-lg leading-8 text-on-surface-muted">{asideDescription}</p>
		</section>

		<section class="mx-auto w-full max-w-md pt-14 lg:pt-0" aria-labelledby={titleId}>
			<div class="mb-8 lg:hidden">
				<p class="text-sm font-semibold tracking-[0.22em] text-brand uppercase">Sonnda</p>
			</div>

			<Card class="rounded-3xl p-6 shadow-xl sm:p-9">
				<div class="mb-8">
					<p class="text-sm font-medium text-brand">{eyebrow}</p>
					<h2 id={titleId} class="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
					{#if description}
						<p class="mt-3 text-sm leading-6 text-on-surface-muted">{description}</p>
					{/if}
				</div>

				{@render children()}
			</Card>

			{#if footer}
				<div class="mt-6 text-center text-xs leading-5 text-on-surface-muted">
					{@render footer()}
				</div>
			{/if}
		</section>
	</div>
</main>
