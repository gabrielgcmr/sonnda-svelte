// src/lib/features/patient/navigation.ts
export const patientSections = ['problems', 'exams', 'medications'] as const;

export type PatientSection = (typeof patientSections)[number];

export function patientSection(value: string | null | undefined): PatientSection {
	return patientSections.find((section) => section === value) ?? 'problems';
}
