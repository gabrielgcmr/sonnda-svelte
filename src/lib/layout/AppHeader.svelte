<!-- src/lib/layout/AppHeader.svelte -->
<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import ThemeToggle from '#lib/ui/ThemeToggle.svelte';

	type Props = {
		displayName: string;
		careType: string;
		loggingOut?: boolean;
		onSignOut: () => void | Promise<void>;
	};

	let { displayName, careType, loggingOut = false, onSignOut }: Props = $props();
</script>

<header class="border-b border-border bg-surface">
	<div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
		<a
			href="/home"
			class="rounded-md text-sm font-bold tracking-[0.22em] text-brand uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
		>
			Sonnda
		</a>

		<div class="flex items-center gap-4">
			<div class="min-w-0 text-right">
				<p class="truncate text-sm font-semibold text-on-surface" title={displayName}>
					{displayName}
				</p>
				<p class="text-xs text-on-surface-muted">{careType}</p>
			</div>
			<ThemeToggle />
			<Button variant="secondary" size="sm" onclick={onSignOut} loading={loggingOut}>
				{loggingOut ? 'Saindo...' : 'Sair'}
			</Button>
		</div>
	</div>
</header>
