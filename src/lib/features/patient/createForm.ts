// src/lib/features/patient/createForm.ts
import type { CreatePatientInput } from './types.js';

export const patientGenderOptions = [
	{ value: 'FEMALE', label: 'Feminino' },
	{ value: 'MALE', label: 'Masculino' },
	{ value: 'OTHER', label: 'Outro' },
	{ value: 'UNKNOWN', label: 'Não informado' }
] as const;

export const patientRaceOptions = [
	{ value: 'WHITE', label: 'Branca' },
	{ value: 'BLACK', label: 'Preta' },
	{ value: 'ASIAN', label: 'Amarela' },
	{ value: 'MIXED', label: 'Parda' },
	{ value: 'INDIGENOUS', label: 'Indígena' },
	{ value: 'UNKNOWN', label: 'Não informada' }
] as const;

export const patientRelationOptions = [
	{ value: 'self', label: 'O próprio paciente' },
	{ value: 'family', label: 'Familiar' },
	{ value: 'caregiver', label: 'Cuidador' },
	{ value: 'professional', label: 'Profissional de saúde' }
] as const;

export type CreatePatientFormValues = {
	fullName: string;
	birthDate: string;
	cpf: string;
	cns: string;
	phone: string;
	gender: string;
	race: string;
	relationType: string;
};

export type CreatePatientField = keyof CreatePatientFormValues;
export type CreatePatientFieldErrors = Partial<Record<CreatePatientField, string>>;
export type CreatePatientValidationResult =
	| { success: true; input: CreatePatientInput }
	| { success: false; errors: CreatePatientFieldErrors };
export type CreatePatientValidationOptions = { allowProfessional?: boolean };

function localDateString(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function isCalendarDate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return false;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
	);
}

function containsNonDigitContent(value: string) {
	return /[^\d\p{P}\s]/u.test(value);
}

export function normalizePatientDigits(value: string) {
	return value.replace(/\D/g, '');
}

export function normalizePatientPhone(value: string) {
	const trimmed = value.trim();
	const prefix = trimmed.startsWith('+') ? '+' : '';
	return `${prefix}${normalizePatientDigits(trimmed)}`;
}

export function isValidPatientCpf(value: string) {
	const cpf = normalizePatientDigits(value);
	if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

	const checkDigit = (base: string, initialWeight: number) => {
		const sum = [...base].reduce(
			(total, digit, index) => total + Number(digit) * (initialWeight - index),
			0
		);
		const remainder = sum % 11;
		return remainder < 2 ? 0 : 11 - remainder;
	};

	const first = checkDigit(cpf.slice(0, 9), 10);
	const second = checkDigit(`${cpf.slice(0, 9)}${first}`, 11);
	return Number(cpf[9]) === first && Number(cpf[10]) === second;
}

export function isValidPatientCns(value: string) {
	const cns = normalizePatientDigits(value);
	if (cns.length !== 15 || cns === '000000000000000') return false;

	const provisionalSum = [...cns].reduce(
		(total, digit, index) => total + Number(digit) * (15 - index),
		0
	);
	if (provisionalSum % 11 === 0) return true;

	const pis = cns.slice(0, 11);
	let sum = [...pis].reduce((total, digit, index) => total + Number(digit) * (15 - index), 0);
	let digit = 11 - (sum % 11);
	let suffix = '000';
	if (digit === 11) digit = 0;
	if (digit === 10) {
		sum += 2;
		digit = 11 - (sum % 11);
		suffix = '001';
	}
	return digit >= 0 && digit <= 9 && cns === `${pis}${suffix}${digit}`;
}

export function validateCreatePatientForm(
	values: CreatePatientFormValues,
	today = new Date(),
	options: CreatePatientValidationOptions = {}
): CreatePatientValidationResult {
	const errors: CreatePatientFieldErrors = {};
	const fullName = values.fullName.trim();
	const birthDate = values.birthDate.trim();
	const rawCpf = values.cpf.trim();
	const rawCns = values.cns.trim();
	const rawPhone = values.phone.trim();
	const cpf = normalizePatientDigits(rawCpf);
	const cns = normalizePatientDigits(rawCns);
	const phone = normalizePatientPhone(rawPhone);

	if (fullName.length < 2 || fullName.length > 120) {
		errors.fullName = 'Informe um nome entre 2 e 120 caracteres.';
	}
	if (!birthDate) {
		errors.birthDate = 'Informe a data de nascimento.';
	} else if (!isCalendarDate(birthDate)) {
		errors.birthDate = 'Informe uma data de nascimento válida.';
	} else if (birthDate > localDateString(today)) {
		errors.birthDate = 'A data de nascimento não pode estar no futuro.';
	}
	if (!rawCpf) {
		errors.cpf = 'Informe o CPF.';
	} else if (containsNonDigitContent(rawCpf) || !isValidPatientCpf(cpf)) {
		errors.cpf = 'Informe um CPF válido.';
	}
	if (rawCns && (containsNonDigitContent(rawCns) || !isValidPatientCns(cns))) {
		errors.cns = 'Informe um CNS válido com 15 dígitos.';
	}

	const phoneBody = rawPhone.startsWith('+') ? rawPhone.slice(1) : rawPhone;
	if (
		rawPhone &&
		(containsNonDigitContent(phoneBody) || phoneBody.includes('+') || !/^\+?\d/.test(phone))
	) {
		errors.phone = 'Use apenas números e um + opcional no início.';
	} else if (rawPhone && phone.replace('+', '').length < 10) {
		errors.phone = 'Informe um telefone com pelo menos 10 dígitos.';
	} else if (rawPhone && phone.replace('+', '').length > 15) {
		errors.phone = 'Informe um telefone com no máximo 15 dígitos.';
	}

	if (!patientGenderOptions.some(({ value }) => value === values.gender)) {
		errors.gender = 'Selecione o gênero.';
	}
	if (!patientRaceOptions.some(({ value }) => value === values.race)) {
		errors.race = 'Selecione a raça/cor.';
	}
	if (!patientRelationOptions.some(({ value }) => value === values.relationType)) {
		errors.relationType = 'Selecione seu vínculo com o paciente.';
	} else if (values.relationType === 'professional' && options.allowProfessional === false) {
		errors.relationType = 'O vínculo profissional exige uma conta do tipo Profissional.';
	}

	if (Object.keys(errors).length > 0) return { success: false, errors };

	const input: CreatePatientInput = {
		full_name: fullName,
		birth_date: birthDate,
		cpf,
		gender: values.gender,
		race: values.race,
		relation_type: values.relationType
	};
	if (cns) input.cns = cns;
	if (phone) input.phone = phone;
	return { success: true, input };
}
