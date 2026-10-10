<!-- src/lib/layout/HeaderMenu.svelte -->
<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import ButtonLink from '#lib/ui/ButtonLink.svelte';
	import ThemeToggle from '#lib/ui/ThemeToggle.svelte';

	type Props = {
		showProfessionalActivation?: boolean;
	};

	let { showProfessionalActivation = false }: Props = $props();
	let container: HTMLDivElement;
	let open = $state(false);

	$effect(() => {
		if (!open || typeof document === 'undefined') return;

		function handlePointerDown(event: PointerEvent) {
			if (!container.contains(event.target as Node)) open = false;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') open = false;
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div class="relative" bind:this={container}>
	<Button
		variant="secondary"
		size="sm"
		class="px-2.5"
		onclick={() => (open = !open)}
		aria-label="Abrir configurações"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-controls="header-settings-panel"
	>
		<svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
			<path
				d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
				stroke="currentColor"
				stroke-width="1.7"
			/>
			<path
				d="m19.1 13.7 1.15.9-1.7 2.95-1.35-.55a7.8 7.8 0 0 1-1.9 1.1l-.2 1.45h-3.4l-.2-1.45A7.8 7.8 0 0 1 9.6 17l-1.35.55-1.7-2.95 1.15-.9a7.4 7.4 0 0 1 0-2.2l-1.15-.9 1.7-2.95L9.6 8.2a7.8 7.8 0 0 1 1.9-1.1l.2-1.45h3.4l.2 1.45a7.8 7.8 0 0 1 1.9 1.1l1.35-.55 1.7 2.95-1.15.9a7.4 7.4 0 0 1 0 2.2Z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</Button>

	{#if open}
		<div
			id="header-settings-panel"
			role="dialog"
			aria-label="Configurações"
			class="absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-4 text-left shadow-xl"
		>
			<div class="flex items-center justify-between gap-4">
				<div>
					<p class="text-sm font-semibold text-on-surface">Tema</p>
					<p class="mt-0.5 text-xs text-on-surface-muted">Escolha a aparência.</p>
				</div>
				<ThemeToggle />
			</div>

			{#if showProfessionalActivation}
				<div class="mt-4 border-t border-border pt-4">
					<ButtonLink href="/professional-activation" variant="secondary" size="sm" class="w-full">
						<svg viewBox="0 0 24 24" fill="none" class="size-4" aria-hidden="true">
							<path
								d="M12 13.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 6.25c.55-3.05 3.25-5.25 7-5.25 1.35 0 2.58.28 3.62.8"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
							<path
								d="M18.5 14.75v6m-3-3h6"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
						</svg>
						Ativação profissional
					</ButtonLink>
				</div>
			{/if}
		</div>
	{/if}
</div>
