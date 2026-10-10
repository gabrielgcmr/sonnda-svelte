// src/lib/features/capture/captureApi.ts
import { PUBLIC_API_URL } from '$app/env/public';
import type { components } from '#lib/generated/openapi.js';

export type CaptureProblem = components['schemas']['ErrorModel'];

export type ClaimedCaptureSession = {
	session_id: string;
	upload_token: string;
	expires_at: string;
};

function fallbackProblem(title: string, status?: number): CaptureProblem {
	return { type: 'about:blank', title, status };
}

function isClaimedCaptureSession(value: unknown): value is ClaimedCaptureSession {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.session_id === 'string' &&
		record.session_id.trim() !== '' &&
		typeof record.upload_token === 'string' &&
		record.upload_token.trim() !== '' &&
		typeof record.expires_at === 'string' &&
		record.expires_at.trim() !== ''
	);
}

async function readProblem(response: Response): Promise<CaptureProblem> {
	try {
		const body: unknown = await response.json();
		if (body && typeof body === 'object' && 'type' in body) {
			return { ...(body as CaptureProblem), status: response.status };
		}
	} catch {
		// The claim failure still becomes one request for a new QR.
	}

	return fallbackProblem('Abra novamente o QR no computador para enviar o exame.', response.status);
}

export async function claimCaptureSession(code: string) {
	try {
		const response = await fetch(`${PUBLIC_API_URL}/capture-sessions/claim`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json'
			},
			body: JSON.stringify({ code })
		});

		if (!response.ok) return { data: undefined, error: await readProblem(response) };

		const body: unknown = await response.json();
		if (!isClaimedCaptureSession(body)) {
			return {
				data: undefined,
				error: fallbackProblem('Não foi possível conectar este celular.', response.status)
			};
		}

		return {
			data: {
				session_id: body.session_id,
				upload_token: body.upload_token,
				expires_at: body.expires_at
			},
			error: undefined
		};
	} catch {
		return {
			data: undefined,
			error: fallbackProblem('Não foi possível conectar à API')
		};
	}
}

export type MobileHeartbeatState = {
	desktop_present: boolean;
	mobile_present: boolean;
	connected: boolean;
};

function isMobileHeartbeatState(value: unknown): value is MobileHeartbeatState {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.desktop_present === 'boolean' &&
		typeof record.mobile_present === 'boolean' &&
		typeof record.connected === 'boolean'
	);
}

export function captureCredentialRejected(error: CaptureProblem | undefined) {
	return error?.status === 401 || error?.status === 404;
}

export async function sendMobileHeartbeat(sessionId: string, uploadToken: string) {
	try {
		const response = await fetch(
			`${PUBLIC_API_URL}/capture-sessions/${encodeURIComponent(sessionId)}/mobile-heartbeat`,
			{
				method: 'POST',
				headers: {
					accept: 'application/json',
					'X-Capture-Token': uploadToken
				}
			}
		);

		if (!response.ok) return { data: undefined, error: await readProblem(response) };

		const body: unknown = await response.json();
		if (!isMobileHeartbeatState(body)) {
			return {
				data: undefined,
				error: fallbackProblem('Não foi possível consultar o computador.', response.status)
			};
		}

		return {
			data: {
				desktop_present: body.desktop_present,
				mobile_present: body.mobile_present,
				connected: body.connected
			},
			error: undefined
		};
	} catch {
		return {
			data: undefined,
			error: fallbackProblem('Não foi possível conectar à API')
		};
	}
}

export type UploadedCapture = {
	original_filename: string;
};

function isUploadedCapture(value: unknown): value is UploadedCapture {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return typeof record.original_filename === 'string' && record.original_filename.trim() !== '';
}

export function uploadCaptureFile(
	uploadToken: string,
	file: File,
	onProgress?: (percent: number) => void
) {
	return new Promise<{ data?: UploadedCapture; error?: CaptureProblem }>((resolve) => {
		const xhr = new XMLHttpRequest();
		const form = new FormData();
		form.append('file', file, file.name);
		xhr.open('POST', `${PUBLIC_API_URL}/captures`);
		xhr.setRequestHeader('accept', 'application/json');
		xhr.setRequestHeader('X-Capture-Token', uploadToken);
		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable || event.total <= 0) return;
			onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
		};
		xhr.onerror = () => {
			resolve({ data: undefined, error: fallbackProblem('Não foi possível conectar à API') });
		};
		xhr.onload = () => {
			const response = new Response(xhr.responseText, {
				status: xhr.status,
				headers: { 'content-type': xhr.getResponseHeader('content-type') ?? 'application/json' }
			});
			void readUploadedCapture(response).then(resolve);
		};
		xhr.send(form);
	});
}

async function readUploadedCapture(response: Response) {
	if (!response.ok) return { data: undefined, error: await readProblem(response) };

	try {
		const body: unknown = await response.json();
		if (!isUploadedCapture(body)) {
			return {
				data: undefined,
				error: fallbackProblem('Não foi possível enviar o exame.', response.status)
			};
		}
		return { data: { original_filename: body.original_filename }, error: undefined };
	} catch {
		return {
			data: undefined,
			error: fallbackProblem('Não foi possível enviar o exame.', response.status)
		};
	}
}
