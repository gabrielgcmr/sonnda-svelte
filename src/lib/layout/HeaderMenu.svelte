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
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-5"
			aria-hidden="true"
		>
			<path
				d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
			/>
			<circle cx="12" cy="12" r="3" />
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
