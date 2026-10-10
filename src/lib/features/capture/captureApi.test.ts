// src/lib/features/capture/captureApi.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	captureCredentialRejected,
	claimCaptureSession,
	sendMobileHeartbeat,
	uploadCaptureFile
} from './captureApi';

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

describe('uploadCaptureFile', () => {
	it('posts one PDF with the capture token and reports progress', async () => {
		const file = new File(['%PDF-1.4'], 'hemograma.pdf', { type: 'application/pdf' });
		const progress: number[] = [];
		let sent:
			| {
					method: string;
					url: string;
					headers: Record<string, string>;
					body: FormData | null;
			  }
			| undefined;
		vi.stubGlobal(
			'XMLHttpRequest',
			class {
				method = '';
				url = '';
				headers: Record<string, string> = {};
				body: FormData | null = null;
				status = 201;
				responseText = JSON.stringify({
					id: 'capture-1',
					original_filename: 'hemograma.pdf',
					pairing_code: 'hidden'
				});
				upload = {
					onprogress: null as ((event: ProgressEvent) => void) | null
				};
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;

				open(method: string, url: string) {
					this.method = method;
					this.url = url;
				}

				setRequestHeader(name: string, value: string) {
					this.headers[name] = value;
				}

				getResponseHeader() {
					return 'application/json';
				}

				send(body: FormData) {
					this.body = body;
					sent = {
						method: this.method,
						url: this.url,
						headers: { ...this.headers },
						body: this.body
					};
					this.upload.onprogress?.({
						lengthComputable: true,
						loaded: 1,
						total: 2
					} as ProgressEvent);
					this.onload?.();
				}
			}
		);

		const result = await uploadCaptureFile('upload-token', file, (percent) =>
			progress.push(percent)
		);

		expect(sent?.method).toBe('POST');
		expect(sent?.url).toBe('http://localhost:8080/captures');
		expect(sent?.headers).toEqual({
			accept: 'application/json',
			'X-Capture-Token': 'upload-token'
		});
		expect(sent?.body?.get('file')).toBeInstanceOf(File);
		expect((sent?.body?.get('file') as File).name).toBe('hemograma.pdf');
		expect(progress).toEqual([50]);
		expect(result.data).toEqual({ original_filename: 'hemograma.pdf' });
	});

	it('returns a rejected credential without a filename', async () => {
		vi.stubGlobal(
			'XMLHttpRequest',
			class {
				status = 401;
				responseText = JSON.stringify({
					type: 'about:blank',
					title: 'credencial de captura inválida ou expirada',
					status: 401
				});
				upload = { onprogress: null };
				onload: (() => void) | null = null;
				open() {}
				setRequestHeader() {}
				getResponseHeader() {
					return 'application/problem+json';
				}
				send() {
					this.onload?.();
				}
			}
		);

		const result = await uploadCaptureFile('expired-token', new File(['%PDF-1.4'], 'exam.pdf'));

		expect(result.data).toBeUndefined();
		expect(captureCredentialRejected(result.error)).toBe(true);
	});
});
