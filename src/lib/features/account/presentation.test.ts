// src/lib/features/account/presentation.test.ts
import { describe, expect, it } from 'vitest';
import { accountTypeLabel } from './presentation';

describe('accountTypeLabel', () => {
	it.each([
		['basic_care', 'Cuidados básicos'],
		['professional', 'Profissional'],
		['unknown', 'Cuidado não informado'],
		[null, 'Cuidado não informado']
	] as const)('presents %s as %s', (accountType, expected) => {
		expect(accountTypeLabel(accountType)).toBe(expected);
	});
});
