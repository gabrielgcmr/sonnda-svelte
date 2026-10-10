// src/lib/features/capture/captureApi.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureCredentialRejected, claimCaptureSession, sendMobileHeartbeat } from './captureApi';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('claimCaptureSession', () => {
	it('claims a pairing code without a Supabase bearer token', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					session_id: 'session',
					upload_token: 'upload-token',
					expires_at: '2026-10-10T18:00:00.000Z',
					pairing_code: 'should-not-be-kept'
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			)
		);
		vi.stubGlobal('fetch', fetchMock);

		const result = await claimCaptureSession('pairing-code');

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('http://localhost:8080/capture-sessions/claim');
		expect(init.method).toBe('POST');
		expect(init.headers).toEqual({
			accept: 'application/json',
			'content-type': 'application/json'
		});
		expect(init.body).toBe(JSON.stringify({ code: 'pairing-code' }));
		expect(result.data).toEqual({
			session_id: 'session',
			upload_token: 'upload-token',
			expires_at: '2026-10-10T18:00:00.000Z'
		});
	});

	it('returns the problem details when the code cannot be claimed', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						type: 'about:blank',
						title: 'código de pareamento inválido ou expirado',
						status: 401
					}),
					{ status: 401, headers: { 'content-type': 'application/problem+json' } }
				)
			)
		);

		const result = await claimCaptureSession('used-code');

		expect(result.data).toBeUndefined();
		expect(result.error).toMatchObject({
			title: 'código de pareamento inválido ou expirado',
			status: 401
		});
	});
});

describe('sendMobileHeartbeat', () => {
	it('posts the capture token header and keeps only the presence flags', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					session_id: 'session/1',
					desktop_present: false,
					mobile_present: true,
					connected: false,
					pairing_code: 'hidden'
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			)
		);
		vi.stubGlobal('fetch', fetchMock);

		const result = await sendMobileHeartbeat('session/1', 'upload-token');

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('http://localhost:8080/capture-sessions/session%2F1/mobile-heartbeat');
		expect(init.method).toBe('POST');
		expect(init.headers).toEqual({
			accept: 'application/json',
			'X-Capture-Token': 'upload-token'
		});
		expect(init.body).toBeUndefined();
		expect(result.data).toEqual({
			desktop_present: false,
			mobile_present: true,
			connected: false
		});
	});

	it('returns the problem when the credential is rejected', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						type: 'about:blank',
						title: 'credencial de captura inválida ou expirada',
						status: 401
					}),
					{ status: 401, headers: { 'content-type': 'application/problem+json' } }
				)
			)
		);

		const result = await sendMobileHeartbeat('session', 'expired-token');

		expect(result.data).toBeUndefined();
		expect(captureCredentialRejected(result.error)).toBe(true);
		expect(captureCredentialRejected({ type: 'about:blank', title: 'ausente', status: 404 })).toBe(
			true
		);
		expect(captureCredentialRejected({ type: 'about:blank', title: 'falha', status: 500 })).toBe(
			false
		);
	});
});
