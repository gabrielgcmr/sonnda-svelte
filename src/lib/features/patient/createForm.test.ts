// src/lib/features/patient/createForm.test.ts
import { describe, expect, it } from 'vitest';
import { isValidPatientCns, isValidPatientCpf, validateCreatePatientForm } from './createForm.js';

const today = new Date(2026, 9, 8);
const validForm = {
	fullName: '  Ana Sonnda  ',
	birthDate: '1990-04-12',
	cpf: '529.982.247-25',
	cns: '174 5984 3528 0018',
	phone: '+55 (11) 99999-9999',
	gender: 'FEMALE',
	race: 'MIXED',
	relationType: 'family'
};

describe('patient identifiers', () => {
	it.each(['52998224725', '12345678909'])('accepts the valid CPF %s', (cpf) => {
		expect(isValidPatientCpf(cpf)).toBe(true);
	});

	it.each(['12345678901', '00000000000'])('rejects the invalid CPF %s', (cpf) => {
		expect(isValidPatientCpf(cpf)).toBe(false);
	});

	it.each(['174598435280018', '700000000000005'])('accepts the valid CNS %s', (cns) => {
		expect(isValidPatientCns(cns)).toBe(true);
	});

	it.each(['123456789012345', '000000000000000'])('rejects the invalid CNS %s', (cns) => {
		expect(isValidPatientCns(cns)).toBe(false);
	});
});

describe('patient creation form', () => {
	it('builds the normalized API payload', () => {
		expect(validateCreatePatientForm(validForm, today)).toEqual({
			success: true,
			input: {
				full_name: 'Ana Sonnda',
				birth_date: '1990-04-12',
				cpf: '52998224725',
				cns: '174598435280018',
				phone: '+5511999999999',
				gender: 'FEMALE',
				race: 'MIXED',
				relation_type: 'family'
			}
		});
	});

	it('omits empty optional fields', () => {
		const result = validateCreatePatientForm({ ...validForm, cns: '', phone: '' }, today);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.input).not.toHaveProperty('cns');
		expect(result.input).not.toHaveProperty('phone');
	});

	it('requires every field used by the access and profile contracts', () => {
		const result = validateCreatePatientForm(
			{
				...validForm,
				fullName: '',
				birthDate: '',
				cpf: '',
				gender: '',
				race: '',
				relationType: ''
			},
			today
		);

		expect(result).toEqual({
			success: false,
			errors: {
				fullName: 'Informe um nome entre 2 e 120 caracteres.',
				birthDate: 'Informe a data de nascimento.',
				cpf: 'Informe o CPF.',
				gender: 'Selecione o gênero.',
				race: 'Selecione a raça/cor.',
				relationType: 'Selecione seu vínculo com o paciente.'
			}
		});
	});

	it('rejects future dates and invalid optional values', () => {
		const result = validateCreatePatientForm(
			{
				...validForm,
				birthDate: '2026-10-09',
				cpf: '123.456.789-01',
				cns: '123456789012345',
				phone: '123'
			},
			today
		);

		expect(result).toEqual({
			success: false,
			errors: {
				birthDate: 'A data de nascimento não pode estar no futuro.',
				cpf: 'Informe um CPF válido.',
				cns: 'Informe um CNS válido com 15 dígitos.',
				phone: 'Informe um telefone com pelo menos 10 dígitos.'
			}
		});
	});

	it('rejects the professional relationship for a non-professional account', () => {
		const result = validateCreatePatientForm(
			{ ...validForm, relationType: 'professional' },
			today,
			{ allowProfessional: false }
		);

		expect(result).toEqual({
			success: false,
			errors: {
				relationType: 'O vínculo profissional exige uma conta do tipo Profissional.'
			}
		});
	});

	it('allows the professional relationship for a professional account', () => {
		const result = validateCreatePatientForm(
			{ ...validForm, relationType: 'professional' },
			today,
			{ allowProfessional: true }
		);

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.input.relation_type).toBe('professional');
	});
});
