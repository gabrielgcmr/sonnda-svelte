// src/lib/features/documentprocessing/temporaryExtractionApi.ts
import { apiClient } from '#lib/api/client.js';

export type TemporaryKind = 'laboratory' | 'imaging';

export function createTemporaryExtractionFromFiles(
	accessToken: string,
	kind: TemporaryKind,
	files: File[]
) {
	const formData = new FormData();
	formData.append('kind', kind);
	for (const file of files) formData.append('files', file, file.name);
	return apiClient.POST('/temporary-extractions', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: formData as unknown as { kind: string; files: string[] }
	});
}

export function createTemporaryExtractionFromCaptures(
	accessToken: string,
	kind: TemporaryKind,
	captureIds: string[]
) {
	return apiClient.POST('/temporary-extractions/from-captures', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: { kind, capture_ids: captureIds }
	});
}

export function listTemporaryExtractions(accessToken: string) {
	return apiClient.GET('/temporary-extractions', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}

export function getTemporaryExtraction(accessToken: string, id: string) {
	return apiClient.GET('/temporary-extractions/{id}', {
		params: { path: { id } },
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}

export function retryTemporaryExtraction(accessToken: string, id: string) {
	return apiClient.POST('/temporary-extractions/{id}/retry', {
		params: { path: { id } },
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}
