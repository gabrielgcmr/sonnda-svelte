// src/lib/ui/theme.svelte.ts
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const storageKey = 'sonnda-theme';
const darkSchemeQuery = '(prefers-color-scheme: dark)';

export function isExplicitTheme(value: string | null): value is ResolvedTheme {
	return value === 'light' || value === 'dark';
}

export function resolveTheme(
	preference: ThemePreference,
	systemPrefersDark: boolean
): ResolvedTheme {
	return preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;
}

class ThemeState {
	preference = $state<ThemePreference>('system');
	resolved = $state<ResolvedTheme>('light');

	#media: MediaQueryList | null = null;
	#initialized = false;

	#apply() {
		const resolved = resolveTheme(this.preference, this.#media?.matches ?? false);
		this.resolved = resolved;

		if (typeof document === 'undefined') return;
		document.documentElement.classList.toggle('light', resolved === 'light');
		document.documentElement.classList.toggle('dark', resolved === 'dark');
		document.documentElement.style.colorScheme = resolved;
	}

	#handleSystemChange = () => {
		if (this.preference === 'system') this.#apply();
	};

	init() {
		if (this.#initialized || typeof window === 'undefined') return;
		this.#initialized = true;
		this.#media = window.matchMedia(darkSchemeQuery);

		let stored: string | null = null;
		try {
			stored = window.localStorage.getItem(storageKey);
		} catch {
			// Storage may be unavailable in privacy-restricted browser contexts.
		}

		this.preference = isExplicitTheme(stored) ? stored : 'system';
		this.#media.addEventListener('change', this.#handleSystemChange);
		this.#apply();
	}

	set(preference: ThemePreference) {
		this.preference = preference;

		if (typeof window !== 'undefined') {
			try {
				if (preference === 'system') {
					window.localStorage.removeItem(storageKey);
				} else {
					window.localStorage.setItem(storageKey, preference);
				}
			} catch {
				// The active choice still applies for this page even without persistence.
			}
		}

		this.#apply();
	}

	destroy() {
		this.#media?.removeEventListener('change', this.#handleSystemChange);
		this.#media = null;
		this.#initialized = false;
	}
}

export const theme = new ThemeState();
