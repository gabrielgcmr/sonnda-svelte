// src/lib/features/patient/navigation.test.ts
import { describe, expect, it } from 'vitest';
import { patientSection } from './navigation';

describe('patientSection', () => {
	it.each(['problems', 'exams', 'medications'] as const)('accepts %s', (section) => {
		expect(patientSection(section)).toBe(section);
	});

	it.each([null, undefined, '', 'unknown'])('defaults %s to problems', (section) => {
		expect(patientSection(section)).toBe('problems');
	});
});
