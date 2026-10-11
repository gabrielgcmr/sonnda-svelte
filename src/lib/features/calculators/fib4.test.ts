// src/lib/features/calculators/fib4.test.ts
import { describe, expect, it } from 'vitest';
import {
	calculateFib4,
	emptyFib4Values,
	evaluateFib4,
	fib4ResultMatches,
	formatFib4Number,
	interpretFib4,
	validateFib4Form,
	type Fib4FormValues
} from './fib4.js';

const validValues: Fib4FormValues = { age: '50', ast: '40', alt: '25', platelets: '200' };

describe('calculateFib4', () => {
	it('matches the sonnda-web reference case', () => {
		expect(calculateFib4({ age: 50, ast: 40, alt: 25, platelets: 200 }).toFixed(2)).toBe('2.00');
	});

	it('applies age × AST / (platelets × √ALT)', () => {
		expect(calculateFib4({ age: 70, ast: 30, alt: 16, platelets: 150 })).toBeCloseTo(3.5, 10);
	});
});

describe('interpretFib4', () => {
	it('interprets risk with the age-adjusted lower cutoff', () => {
		expect(interpretFib4(1.0, 50)).toBe('low');
		expect(interpretFib4(1.5, 50)).toBe('indeterminate');
		expect(interpretFib4(1.5, 70)).toBe('low');
		expect(interpretFib4(2.67, 50)).toBe('indeterminate');
		expect(interpretFib4(3, 50)).toBe('high');
	});

	it('treats the cutoffs as boundaries', () => {
		expect(interpretFib4(1.29, 64)).toBe('low');
		expect(interpretFib4(1.3, 64)).toBe('indeterminate');
		expect(interpretFib4(1.99, 65)).toBe('low');
		expect(interpretFib4(2.0, 65)).toBe('indeterminate');
		expect(interpretFib4(2.68, 65)).toBe('high');
	});
});

describe('validateFib4Form', () => {
	it('accepts valid values and decimal commas', () => {
		expect(validateFib4Form({ age: '50', ast: '40,5', alt: '25.2', platelets: ' 200 ' })).toEqual({
			success: true,
			input: { age: 50, ast: 40.5, alt: 25.2, platelets: 200 }
		});
	});

	it('reports missing values', () => {
		expect(validateFib4Form(emptyFib4Values)).toEqual({
			success: false,
			errors: {
				age: 'Informe a idade.',
				ast: 'Informe o AST (TGO).',
				alt: 'Informe o ALT (TGP).',
				platelets: 'Informe as plaquetas.'
			}
		});
	});

	it.each(['0', '-5', 'abc', '1e3', 'Infinity', '1.000,5', '9'.repeat(400)])(
		'rejects %s as an enzyme value',
		(alt) => {
			const validation = validateFib4Form({ ...validValues, alt });
			expect(validation).toEqual({
				success: false,
				errors: { alt: 'Informe um valor de ALT (TGP) maior que zero.' }
			});
		}
	);

	it('rejects fractional, out-of-range and non-numeric ages', () => {
		expect(validateFib4Form({ ...validValues, age: '50,5' })).toMatchObject({
			errors: { age: 'Informe a idade em anos completos.' }
		});
		expect(validateFib4Form({ ...validValues, age: '17' })).toMatchObject({
			errors: { age: 'Informe uma idade entre 18 e 120 anos.' }
		});
		expect(validateFib4Form({ ...validValues, age: '121' })).toMatchObject({
			errors: { age: 'Informe uma idade entre 18 e 120 anos.' }
		});
	});

	it('rejects platelets that look like a count per µL instead of 10³/µL', () => {
		expect(validateFib4Form({ ...validValues, platelets: '250000' })).toEqual({
			success: false,
			errors: { platelets: 'Informe as plaquetas em 10³/µL (exemplo: 250 para 250.000/µL).' }
		});
	});
});

describe('evaluateFib4', () => {
	it('returns the rounded value, risk and cutoff for the values used', () => {
		const evaluation = evaluateFib4(validValues);
		expect(evaluation).toEqual({
			success: true,
			result: {
				values: validValues,
				input: { age: 50, ast: 40, alt: 25, platelets: 200 },
				value: 2,
				risk: 'indeterminate',
				lowCutoff: 1.3
			}
		});
	});

	it('uses the elderly cutoff from 65 years', () => {
		const evaluation = evaluateFib4({ age: '70', ast: '24', alt: '36', platelets: '160' });
		expect(evaluation).toMatchObject({
			success: true,
			result: { value: 1.75, risk: 'low', lowCutoff: 2 }
		});
	});

	it('does not return a result for invalid values', () => {
		expect(evaluateFib4({ ...validValues, platelets: '' }).success).toBe(false);
	});
});

describe('fib4ResultMatches', () => {
	it('invalidates the result when any value used in the calculation changes', () => {
		const evaluation = evaluateFib4(validValues);
		if (!evaluation.success) throw new Error('expected a valid evaluation');
		const { result } = evaluation;

		expect(fib4ResultMatches(result, { ...validValues })).toBe(true);
		expect(fib4ResultMatches(result, { ...validValues, ast: '41' })).toBe(false);
		expect(fib4ResultMatches(result, { ...validValues, platelets: '200,0' })).toBe(false);
		expect(fib4ResultMatches(null, validValues)).toBe(false);
	});

	it('keeps the calculated values isolated from later edits', () => {
		const values = { ...validValues };
		const evaluation = evaluateFib4(values);
		if (!evaluation.success) throw new Error('expected a valid evaluation');
		values.age = '60';

		expect(evaluation.result.values.age).toBe('50');
		expect(fib4ResultMatches(evaluation.result, values)).toBe(false);
	});
});

describe('formatFib4Number', () => {
	it('formats with two decimals in pt-BR', () => {
		expect(formatFib4Number(2)).toBe('2,00');
		expect(formatFib4Number(1.756)).toBe('1,76');
	});
});
