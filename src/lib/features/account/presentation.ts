// src/lib/features/account/presentation.ts
export function accountTypeLabel(accountType: string | null | undefined) {
	switch (accountType) {
		case 'basic_care':
			return 'Cuidados básicos';
		case 'professional':
			return 'Profissional';
		default:
			return 'Cuidado não informado';
	}
}
