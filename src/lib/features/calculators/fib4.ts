// src/lib/features/calculators/fib4.ts
export type Fib4Input = {
	age: number;
	ast: number;
	alt: number;
	platelets: number;
};

export type Fib4Field = keyof Fib4Input;
export type Fib4FormValues = Record<Fib4Field, string>;
export type Fib4FieldErrors = Partial<Record<Fib4Field, string>>;
export type Fib4ValidationResult =
	{ success: true; input: Fib4Input } | { success: false; errors: Fib4FieldErrors };

export type Fib4Risk = 'low' | 'indeterminate' | 'high';

export type Fib4Result = {
	values: Fib4FormValues;
	input: Fib4Input;
	value: number;
	risk: Fib4Risk;
	lowCutoff: number;
};

export type Fib4Evaluation =
	{ success: true; result: Fib4Result } | { success: false; errors: Fib4FieldErrors };

export const fib4Fields: readonly Fib4Field[] = ['age', 'ast', 'alt', 'platelets'];

export const emptyFib4Values: Fib4FormValues = { age: '', ast: '', alt: '', platelets: '' };

export const MIN_FIB4_AGE = 18;
export const MAX_FIB4_AGE = 120;
export const MAX_FIB4_PLATELETS = 2000;
export const FIB4_HIGH_CUTOFF = 2.67;
export const FIB4_RELIABLE_FROM_AGE = 35;
export const FIB4_ELDERLY_AGE = 65;

const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/;
const INTEGER_PATTERN = /^\d+$/;

export const fib4RiskLabels: Record<Fib4Risk, string> = {
	low: 'Baixo risco de fibrose avançada',
	indeterminate: 'Risco indeterminado',
	high: 'Alto risco de fibrose avançada'
};

function parsePositiveDecimal(raw: string) {
	const value = raw.trim();
	if (!DECIMAL_PATTERN.test(value)) return null;
	const parsed = Number(value.replace(',', '.'));
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function validateAge(raw: string): number | string {
	const value = raw.trim();
	if (!value) return 'Informe a idade.';
	const age = INTEGER_PATTERN.test(value) ? Number(value) : Number.NaN;
	if (!Number.isFinite(age)) return 'Informe a idade em anos completos.';
	if (age < MIN_FIB4_AGE || age > MAX_FIB4_AGE) {
		return `Informe uma idade entre ${MIN_FIB4_AGE} e ${MAX_FIB4_AGE} anos.`;
	}
	return age;
}

function validateEnzyme(raw: string, name: string): number | string {
	if (!raw.trim()) return `Informe o ${name}.`;
	return parsePositiveDecimal(raw) ?? `Informe um valor de ${name} maior que zero.`;
}

function validatePlatelets(raw: string): number | string {
	if (!raw.trim()) return 'Informe as plaquetas.';
	const platelets = parsePositiveDecimal(raw);
	if (platelets === null) return 'Informe um valor de plaquetas maior que zero.';
	if (platelets > MAX_FIB4_PLATELETS) {
		return 'Informe as plaquetas em 10³/µL (exemplo: 250 para 250.000/µL).';
	}
	return platelets;
}

export function validateFib4Form(values: Fib4FormValues): Fib4ValidationResult {
	const age = validateAge(values.age);
	const ast = validateEnzyme(values.ast, 'AST (TGO)');
	const alt = validateEnzyme(values.alt, 'ALT (TGP)');
	const platelets = validatePlatelets(values.platelets);

	if (
		typeof age === 'number' &&
		typeof ast === 'number' &&
		typeof alt === 'number' &&
		typeof platelets === 'number'
	) {
		return { success: true, input: { age, ast, alt, platelets } };
	}

	const errors: Fib4FieldErrors = {};
	if (typeof age === 'string') errors.age = age;
	if (typeof ast === 'string') errors.ast = ast;
	if (typeof alt === 'string') errors.alt = alt;
	if (typeof platelets === 'string') errors.platelets = platelets;
	return { success: false, errors };
}

export function calculateFib4({ age, ast, alt, platelets }: Fib4Input): number {
	return (age * ast) / (platelets * Math.sqrt(alt));
}

// A partir de 65 anos, o corte inferior passa a 2,0 (McPherson et al., 2017).
export function fib4LowCutoff(age: number) {
	return age >= FIB4_ELDERLY_AGE ? 2.0 : 1.3;
}

export function interpretFib4(value: number, age: number): Fib4Risk {
	if (value < fib4LowCutoff(age)) return 'low';
	if (value <= FIB4_HIGH_CUTOFF) return 'indeterminate';
	return 'high';
}

export function evaluateFib4(values: Fib4FormValues): Fib4Evaluation {
	const validation = validateFib4Form(values);
	if (!validation.success) return validation;

	const { input } = validation;
	const raw = calculateFib4(input);
	if (!Number.isFinite(raw)) {
		return {
			success: false,
			errors: { platelets: 'Não foi possível calcular com estes valores.' }
		};
	}
	// A interpretação usa o mesmo valor arredondado que é exibido.
	const value = Math.round(raw * 100) / 100;
	return {
		success: true,
		result: {
			values: { ...values },
			input,
			value,
			risk: interpretFib4(value, input.age),
			lowCutoff: fib4LowCutoff(input.age)
		}
	};
}

export function fib4ResultMatches(result: Fib4Result | null, values: Fib4FormValues) {
	return result !== null && fib4Fields.every((field) => result.values[field] === values[field]);
}

export function formatFib4Number(value: number) {
	return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
