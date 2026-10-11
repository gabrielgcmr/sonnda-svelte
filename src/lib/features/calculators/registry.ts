// src/lib/features/calculators/registry.ts
export type CalculatorId = 'fib4' | 'egfr' | 'bmi';

export type CalculatorDefinition = {
	id: CalculatorId;
	label: string;
	available: boolean;
};

export const calculators: readonly CalculatorDefinition[] = [
	{ id: 'fib4', label: 'FIB-4', available: true },
	{ id: 'egfr', label: 'TFG', available: false },
	{ id: 'bmi', label: 'IMC', available: false }
];

export const defaultCalculatorId: CalculatorId = 'fib4';
