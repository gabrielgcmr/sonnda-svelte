// src/lib/features/account/accountApi.ts
import { apiClient } from '#lib/api/client.js';
import type { ProfessionalActivationInput, UpdateAccountInput } from './types';

function authorizationHeaders(accessToken: string) {
	return {
		Authorization: `Bearer ${accessToken}`
	};
}

export function getCurrentAccount(accessToken: string) {
	return apiClient.GET('/me', {
		headers: authorizationHeaders(accessToken)
	});
}

export function updateCurrentAccount(accessToken: string, input: UpdateAccountInput) {
	return apiClient.PATCH('/me', {
		headers: authorizationHeaders(accessToken),
		body: input
	});
}

export function activateCurrentAccountAsProfessional(
	accessToken: string,
	input: ProfessionalActivationInput
) {
	return apiClient.POST('/me/professional-activation', {
		headers: authorizationHeaders(accessToken),
		body: input
	});
}
