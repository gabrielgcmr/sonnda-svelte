// src/lib/features/capture/desktopCaptureApi.ts
import { apiClient } from '#lib/api/client.js';

function authorization(accessToken: string) {
	return { Authorization: `Bearer ${accessToken}` };
}

export function createDesktopCaptureSession(accessToken: string) {
	return apiClient.POST('/capture-sessions', {
		headers: authorization(accessToken)
	});
}

export function getCurrentDesktopCaptureSession(accessToken: string) {
	return apiClient.GET('/capture-sessions/current', {
		headers: authorization(accessToken)
	});
}

export function heartbeatDesktopCaptureSession(accessToken: string, sessionId: string) {
	return apiClient.POST('/capture-sessions/{sessionId}/heartbeat', {
		headers: authorization(accessToken),
		params: { path: { sessionId } }
	});
}

export function revokeDesktopCaptureSession(accessToken: string, sessionId: string) {
	return apiClient.DELETE('/capture-sessions/{sessionId}', {
		headers: authorization(accessToken),
		params: { path: { sessionId } }
	});
}

export function listInboxCaptures(accessToken: string, query: { limit: number; offset: number }) {
	return apiClient.GET('/captures', {
		headers: authorization(accessToken),
		params: { query }
	});
}

export function getInboxCaptureFile(accessToken: string, captureId: string) {
	return apiClient.GET('/captures/{captureId}/file', {
		headers: authorization(accessToken),
		params: { path: { captureId } }
	});
}

export function capturePairingUrl(origin: string, pairingCode: string) {
	const url = new URL('/capture', origin);
	url.searchParams.set('code', pairingCode);
	return url.toString();
}
