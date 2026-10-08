// src/lib/features/account/accountApi.ts
import { apiClient } from '#lib/api/client.js';
import type { UpdateAccountInput } from './types';

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
