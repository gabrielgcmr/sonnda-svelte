// src/lib/features/capture/captureApi.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { claimCaptureSession } from './captureApi';

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
