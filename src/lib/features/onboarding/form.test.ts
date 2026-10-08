// src/lib/features/onboarding/form.test.ts
import { describe, expect, it } from 'vitest';
import { normalizeCpf, normalizePhone, validateOnboardingForm } from './form';

const today = new Date(2026, 9, 8);
const validForm = {
	fullName: '  Ana Sonnda  ',
	birthDate: '1990-04-12',
	cpf: '123.456.789-01',
	phone: '+55 (11) 99999-9999'
};

describe('onboarding form normalization', () => {
	it('removes CPF punctuation', () => {
		expect(normalizeCpf('123.456.789-01')).toBe('12345678901');
	});

	it('removes phone punctuation and preserves a leading plus', () => {
		expect(normalizePhone('+55 (11) 99999-9999')).toBe('+5511999999999');
		expect(normalizePhone('(11) 99999-9999')).toBe('11999999999');
	});

	it('builds a normalized API payload', () => {
		expect(validateOnboardingForm(validForm, today)).toEqual({
			success: true,
			input: {
				full_name: 'Ana Sonnda',
				birth_date: '1990-04-12',
				cpf: '12345678901',
				phone: '+5511999999999'
			}
		});
	});

	it('omits empty optional fields from the payload', () => {
		expect(validateOnboardingForm({ ...validForm, cpf: ' ', phone: '' }, today)).toEqual({
			success: true,
			input: {
				full_name: 'Ana Sonnda',
				birth_date: '1990-04-12'
			}
		});
	});
});

describe('onboarding form validation', () => {
	it.each([
		['A', 'Informe um nome entre 2 e 120 caracteres.'],
		['A'.repeat(121), 'Informe um nome entre 2 e 120 caracteres.']
	])('rejects an invalid full name', (fullName, message) => {
		const result = validateOnboardingForm({ ...validForm, fullName }, today);

		expect(result).toEqual({ success: false, errors: { fullName: message } });
	});

	it.each([
		['', 'Informe sua data de nascimento.'],
		['2026-02-30', 'Informe uma data de nascimento válida.'],
		['2026-10-09', 'A data de nascimento não pode estar no futuro.']
	])('rejects the birth date %s', (birthDate, message) => {
		const result = validateOnboardingForm({ ...validForm, birthDate }, today);

		expect(result).toEqual({ success: false, errors: { birthDate: message } });
	});

	it.each(['123.456.789-0', '123.456.789-012', '1234567890A'])('rejects the CPF %s', (cpf) => {
		const result = validateOnboardingForm({ ...validForm, cpf }, today);

		expect(result).toEqual({
			success: false,
			errors: { cpf: 'Informe um CPF com exatamente 11 dígitos.' }
		});
	});

	it.each([
		['+55 11 9999A-9999', 'Use apenas números e um + opcional no início.'],
		['55+11 99999-9999', 'Use apenas números e um + opcional no início.'],
		['123456789', 'Informe um telefone com pelo menos 10 dígitos.'],
		['+1234567890123456', 'Informe um telefone com no máximo 15 dígitos.']
	])('rejects the phone %s', (phone, message) => {
		const result = validateOnboardingForm({ ...validForm, phone }, today);

		expect(result).toEqual({ success: false, errors: { phone: message } });
	});
});
