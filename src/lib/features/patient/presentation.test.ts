// src/lib/features/patient/presentation.test.ts
import { describe, expect, it } from 'vitest';
import {
	formatPatientCpf,
	formatPatientDate,
	patientAge,
	patientGenderLabel,
	patientInitials,
	patientRaceLabel
} from './presentation.js';

describe('patient presentation', () => {
	it('calculates age before and after the birthday', () => {
		expect(patientAge('1990-10-09', new Date(2026, 9, 8, 12))).toBe(35);
		expect(patientAge('1990-10-08', new Date(2026, 9, 8, 12))).toBe(36);
	});

	it('formats profile values for Brazilian Portuguese', () => {
		expect(formatPatientDate('1990-04-12T00:00:00Z')).toBe('12/04/1990');
		expect(formatPatientCpf('12345678901')).toBe('123.456.789-01');
		expect(patientGenderLabel('FEMALE')).toBe('Feminino');
		expect(patientRaceLabel('MIXED')).toBe('Parda');
	});

	it('creates compact initials and preserves unknown demographic values', () => {
		expect(patientInitials('  Ana Maria Sonnda  ')).toBe('AM');
		expect(patientGenderLabel('NOT_LISTED')).toBe('NOT_LISTED');
		expect(patientRaceLabel('NOT_LISTED')).toBe('NOT_LISTED');
	});
});
