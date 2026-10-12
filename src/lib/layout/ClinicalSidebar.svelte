<!-- src/lib/layout/ClinicalSidebar.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '#lib/ui/Button.svelte';

	let {
		capturesOpen,
		onCaptures,
		panel
	}: { capturesOpen: boolean; onCaptures: () => void; panel: Snippet } = $props();
	let expanded = $state(false);

	function toggleExpanded() {
		if (expanded && capturesOpen) onCaptures();
		expanded = !expanded;
	}

	function handleCaptures() {
		if (!capturesOpen) expanded = true;
		onCaptures();
	}
	const upcoming = [
		{
			label: 'LME',
			icon: 'M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M9 2h6v4H9V2Zm-1 9h8m-8 4h8'
		},
		{
			label: 'Assistente de diagnóstico',
			icon: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z'
		}
	] as const;
</script>

{#snippet icon(path: string)}
	<svg viewBox="0 0 24 24" fill="none" class="size-5 shrink-0" aria-hidden="true">
		<path
			d={path}
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<aside
	aria-label="Capturas e ferramentas"
	class={[
		'flex max-h-[calc(100dvh-3rem)] flex-col rounded-2xl border border-border bg-surface shadow-sm',
		expanded ? 'w-[420px]' : 'w-14'
	]}
>
	<div class="flex min-h-14 items-center justify-between gap-2 border-b border-border p-2">
		{#if expanded}
			<p class="pl-2 text-sm font-semibold text-on-surface">Capturas e ferramentas</p>
		{/if}
		<Button
			variant="ghost"
			size="sm"
			class="size-9 shrink-0 p-0!"
			aria-label={expanded ? 'Recolher a barra lateral' : 'Expandir a barra lateral'}
			title={expanded ? 'Recolher a barra lateral' : 'Expandir a barra lateral'}
			aria-expanded={expanded}
			aria-controls="sidebar-navigation"
			onclick={toggleExpanded}
		>
			<svg viewBox="0 0 24 24" fill="none" class="size-5 shrink-0" aria-hidden="true">
				<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8" />
				<path d="M9 4v16" stroke="currentColor" stroke-width="1.8" />
				<path
					d={expanded ? 'm16 9-3 3 3 3' : 'm13 9 3 3-3 3'}
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</Button>
	</div>
	<nav id="sidebar-navigation" class="min-h-0 overflow-y-auto p-2" aria-label="Barra lateral">
		<ul class="space-y-1">
			<li>
				<button
					id="captures-sidebar-button"
					type="button"
					title={expanded ? undefined : 'Capturas'}
					aria-expanded={capturesOpen}
					aria-controls="capture-inbox-panel"
					onclick={handleCaptures}
					class={[
						'flex min-h-10 w-full items-center rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
						expanded ? 'gap-3 px-3 py-2.5' : 'justify-center',
						capturesOpen
							? 'bg-brand-container text-on-brand-container'
							: 'text-on-surface-muted hover:bg-surface-muted hover:text-on-surface'
					]}
				>
					{@render icon(
						'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 16h2'
					)}
					<span class={expanded ? '' : 'sr-only'}>Capturas</span>
				</button>
			</li>
			{#if capturesOpen}
				<li class="rounded-xl bg-canvas p-3">{@render panel()}</li>
			{/if}
		</ul>
		<ul class="mt-3 space-y-1 border-t border-border pt-3">
			{#each upcoming as item (item.label)}
				<li>
					<button
						type="button"
						disabled
						title={`${item.label} — Em breve`}
						class={[
							'flex min-h-10 w-full cursor-not-allowed items-center rounded-xl text-left text-sm text-on-surface-muted',
							expanded ? 'gap-3 px-3 py-2.5' : 'justify-center'
						]}
					>
						{@render icon(item.icon)}
						<span class={expanded ? 'min-w-0' : 'sr-only'}>
							<span class="block font-medium">{item.label}</span>
							<span class="block text-xs">Em breve</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>
</aside>
