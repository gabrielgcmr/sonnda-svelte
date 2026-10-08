<!-- src/lib/layout/UserNavigation.svelte -->
<script lang="ts">
	import { page } from '$app/state';

	const items = [
		{ href: '/home', label: 'Meus pacientes', exact: true },
		{ href: '/home/exams', label: 'Extrair exames', exact: false },
		{ href: '/home/calculators', label: 'Cálculos clínicos', exact: false }
	] as const;

	function normalizePath(pathname: string) {
		return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
	}

	const pathname = $derived(normalizePath(page.url.pathname));
	const navigation = $derived(
		items.map((item) => ({
			...item,
			active: item.exact
				? pathname === item.href
				: pathname === item.href || pathname.startsWith(`${item.href}/`)
		}))
	);
</script>

<nav class="border-b border-border bg-surface" aria-label="Ferramentas do usuário">
	<div class="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 lg:px-8">
		{#each navigation as item (item.href)}
			<a
				href={item.href}
				aria-current={item.active ? 'page' : undefined}
				class={`rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
					item.active
						? 'bg-brand-container text-on-brand-container'
						: 'text-on-surface-muted hover:bg-surface-muted hover:text-on-surface'
				}`}
			>
				{item.label}
			</a>
		{/each}
	</div>
</nav>
