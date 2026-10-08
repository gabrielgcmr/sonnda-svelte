<!-- src/lib/ui/ThemeToggle.svelte -->
<script lang="ts">
	import { theme, type ThemePreference } from './theme.svelte';

	const labels: Record<ThemePreference, string> = {
		system: 'Sistema',
		light: 'Claro',
		dark: 'Escuro'
	};

	function handleChange(event: Event) {
		theme.set((event.currentTarget as HTMLSelectElement).value as ThemePreference);
	}
</script>

<label
	class="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-on-surface shadow-sm transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25"
>
	<svg viewBox="0 0 24 24" fill="none" class="size-4 text-brand" aria-hidden="true">
		<path
			d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42M7.06 16.94l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
	<span class="sr-only">Tema</span>
	<select
		value={theme.preference}
		onchange={handleChange}
		aria-label={`Tema: ${labels[theme.preference]}`}
		class="cursor-pointer bg-transparent text-sm font-medium text-on-surface outline-none"
	>
		<option value="system">Sistema</option>
		<option value="light">Claro</option>
		<option value="dark">Escuro</option>
	</select>
	<span class="sr-only" aria-live="polite">Tema ativo: {labels[theme.resolved]}</span>
</label>
