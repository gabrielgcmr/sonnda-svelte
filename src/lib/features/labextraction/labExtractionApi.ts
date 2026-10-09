// src/lib/features/labextraction/labExtractionApi.ts
import { apiClient } from '#lib/api/client.js';

export function extractStandaloneLabReport(accessToken: string, file: File) {
	const formData = new FormData();
	formData.append('file', file, file.name);

	return apiClient.POST('/lab-extractions', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: formData as unknown as { file: string }
	});
}
