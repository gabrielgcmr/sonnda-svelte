// src/lib/features/account/accountApi.ts
import { apiClient } from '#lib/api/client.js';

export function getCurrentAccount(accessToken: string) {
	return apiClient.GET('/me', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
}
