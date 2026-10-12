<!-- src/lib/layout/UserNavigation.svelte -->
<script lang="ts">
	import { page } from '$app/state';

	const items = [
		{
			href: '/home',
			label: 'Meus pacientes',
			icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6m-3-3h6',
			exact: true
		},
		{
			href: '/home/exams',
			label: 'Extrair exames',
			icon: 'M9 3h6m-5 0v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3M7.5 15h9',
			exact: false
		},
		{
			href: '/home/calculators',
			label: 'Calculadoras clínicas',
			icon: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1',
			exact: false
		}
	] as const;
	const pathname = $derived(page.url.pathname.replace(/\/+$/, '') || '/');

	function isActive(item: (typeof items)[number]) {
		if (item.href === '/home' && pathname.startsWith('/patients/')) return true;
		return pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
	}
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

<nav class="border-b border-border bg-surface" aria-label="Ferramentas do usuário">
	<ul class="flex gap-1 overflow-x-auto px-4 lg:px-6">
		{#each items as item (item.href)}
			<li class="shrink-0">
				<a
					href={item.href}
					aria-current={isActive(item) ? 'page' : undefined}
					class={[
						'inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
						isActive(item)
							? 'border-brand text-brand'
							: 'border-transparent text-on-surface-muted hover:text-on-surface'
					]}
				>
					{@render icon(item.icon)}
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
