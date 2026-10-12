// src/lib/features/imagingextraction/imagingExtractionApi.ts
import { apiClient } from '#lib/api/client.js';

export function extractStandaloneImagingReport(accessToken: string, file: File) {
	const formData = new FormData();
	formData.append('file', file, file.name);

	return apiClient.POST('/imaging-report-extractions', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: formData as unknown as { file: string }
	});
}

export function extractImagingReportFromCapture(accessToken: string, captureId: string) {
	return apiClient.POST('/imaging-report-extractions/from-capture', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: { capture_id: captureId }
	});
}

export function extractImagingReportPages(accessToken: string, files: File[]) {
	const formData = new FormData();
	for (const file of files) formData.append('files', file, file.name);
	return apiClient.POST('/imaging-report-extractions/pages', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: formData as unknown as { files: string[] }
	});
}

export function extractImagingReportFromCaptures(accessToken: string, captureIds: string[]) {
	return apiClient.POST('/imaging-report-extractions/from-captures', {
		headers: { Authorization: `Bearer ${accessToken}` },
		body: { capture_ids: captureIds }
	});
}
