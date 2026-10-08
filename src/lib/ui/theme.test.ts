// src/lib/ui/theme.test.ts
import { describe, expect, it } from 'vitest';
import { isExplicitTheme, resolveTheme } from './theme.svelte';

describe('theme resolution', () => {
	it.each([
		['light', false, 'light'],
		['light', true, 'light'],
		['dark', false, 'dark'],
		['dark', true, 'dark'],
		['system', false, 'light'],
		['system', true, 'dark']
	] as const)('resolves %s with systemDark=%s to %s', (preference, systemDark, expected) => {
		expect(resolveTheme(preference, systemDark)).toBe(expected);
	});

	it.each([
		['light', true],
		['dark', true],
		['system', false],
		[null, false]
	] as const)('recognizes persisted explicit value %s', (value, expected) => {
		expect(isExplicitTheme(value)).toBe(expected);
	});
});
