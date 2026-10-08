// src/lib/features/patient/presentation.ts
const genderLabels: Record<string, string> = {
	MALE: 'Masculino',
	FEMALE: 'Feminino',
	OTHER: 'Outro',
	UNKNOWN: 'Não informado'
};

const raceLabels: Record<string, string> = {
	WHITE: 'Branca',
	BLACK: 'Preta',
	ASIAN: 'Amarela',
	MIXED: 'Parda',
	INDIGENOUS: 'Indígena',
	UNKNOWN: 'Não informada'
};

function dateParts(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
	if (!match) return null;
	return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function patientAge(birthDate: string, today = new Date()) {
	const birth = dateParts(birthDate);
	if (!birth) return null;

	let age = today.getFullYear() - birth.year;
	if (
		today.getMonth() + 1 < birth.month ||
		(today.getMonth() + 1 === birth.month && today.getDate() < birth.day)
	) {
		age -= 1;
	}
	return age >= 0 ? age : null;
}

export function formatPatientDate(value: string) {
	const parts = dateParts(value);
	if (!parts) return value;
	return `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}`;
}

export function formatPatientCpf(value: string) {
	const digits = value.replace(/\D/g, '');
	if (digits.length !== 11) return value;
	return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function patientGenderLabel(value: string) {
	return genderLabels[value] ?? value;
}

export function patientRaceLabel(value: string) {
	return raceLabels[value] ?? value;
}

export function patientInitials(fullName: string) {
	return fullName
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toLocaleUpperCase('pt-BR') ?? '')
		.join('');
}
