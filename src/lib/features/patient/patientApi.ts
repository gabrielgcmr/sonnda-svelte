// src/lib/features/patient/patientApi.ts
import { apiClient } from '#lib/api/client.js';

function authorizationHeaders(accessToken: string) {
	return { Authorization: `Bearer ${accessToken}` };
}

export function listAccessiblePatients(accessToken: string, limit: number, offset: number) {
	return apiClient.GET('/me/patients', {
		headers: authorizationHeaders(accessToken),
		params: { query: { limit, offset } }
	});
}

export function getPatient(accessToken: string, patientId: string) {
	return apiClient.GET('/patients/{patientId}', {
		headers: authorizationHeaders(accessToken),
		params: { path: { patientId } }
	});
}
