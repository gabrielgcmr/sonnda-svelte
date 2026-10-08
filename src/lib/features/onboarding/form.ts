// src/lib/features/onboarding/form.ts
import type { UpdateAccountInput } from '#lib/features/account/types.js';

export type OnboardingFormValues = {
	fullName: string;
	birthDate: string;
	cpf: string;
	phone: string;
};

export type OnboardingField = keyof OnboardingFormValues;
export type OnboardingFieldErrors = Partial<Record<OnboardingField, string>>;

export type OnboardingValidationResult =
	{ success: true; input: UpdateAccountInput } | { success: false; errors: OnboardingFieldErrors };

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

export function normalizeCpf(value: string) {
	return value.replace(/\D/g, '');
}

export function normalizePhone(value: string) {
	const trimmed = value.trim();
	const prefix = trimmed.startsWith('+') ? '+' : '';
	return `${prefix}${trimmed.replace(/\D/g, '')}`;
}

export function validateOnboardingForm(
	values: OnboardingFormValues,
	today = new Date()
): OnboardingValidationResult {
	const errors: OnboardingFieldErrors = {};
	const fullName = values.fullName.trim();
	const birthDate = values.birthDate.trim();
	const rawCpf = values.cpf.trim();
	const rawPhone = values.phone.trim();
	const cpf = normalizeCpf(rawCpf);
	const phone = normalizePhone(rawPhone);

	if (fullName.length < 2 || fullName.length > 120) {
		errors.fullName = 'Informe um nome entre 2 e 120 caracteres.';
	}

	if (!birthDate) {
		errors.birthDate = 'Informe sua data de nascimento.';
	} else if (!isCalendarDate(birthDate)) {
		errors.birthDate = 'Informe uma data de nascimento válida.';
	} else if (birthDate > localDateString(today)) {
		errors.birthDate = 'A data de nascimento não pode estar no futuro.';
	}

	if (rawCpf && (containsNonDigitContent(rawCpf) || cpf.length !== 11)) {
		errors.cpf = 'Informe um CPF com exatamente 11 dígitos.';
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

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const input: UpdateAccountInput = {
		full_name: fullName,
		birth_date: birthDate
	};

	if (cpf) input.cpf = cpf;
	if (phone) input.phone = phone;

	return { success: true, input };
}
