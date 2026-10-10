// src/lib/features/capture/captureSession.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { claimCaptureSession } = vi.hoisted(() => ({
	claimCaptureSession: vi.fn()
}));

vi.mock('./captureApi.js', () => ({ claimCaptureSession }));

import { CaptureSession } from './captureSession.svelte.js';
import { captureCredentialStorageKey, readStoredCaptureCredential } from './storedCredential.js';

function memoryStorage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
		values
	};
}

beforeEach(() => {
	claimCaptureSession.mockReset();
});

describe('CaptureSession', () => {
	it('restores a stored credential without claiming again', () => {
		const storage = memoryStorage();
		storage.setItem(
			captureCredentialStorageKey,
			JSON.stringify({
				session_id: 'session',
				upload_token: 'token',
				expires_at: '2999-01-01T00:00:00.000Z'
			})
		);
		const session = new CaptureSession();

		session.restore(storage);

		expect(session.status).toBe('ready');
		expect(session.credential?.sessionId).toBe('session');
		expect(claimCaptureSession).not.toHaveBeenCalled();
	});

	it('stores the claim and removes the code from the URL once', async () => {
		const storage = memoryStorage();
		const removeCodeFromUrl = vi.fn().mockResolvedValue(undefined);
		claimCaptureSession.mockResolvedValue({
			data: {
				session_id: 'session',
				upload_token: 'upload-token',
				expires_at: '2999-01-01T00:00:00.000Z'
			}
		});
		const session = new CaptureSession();

		expect(await session.claim('pairing-code', storage, removeCodeFromUrl)).toBe(true);
		expect(await session.claim('pairing-code', storage, removeCodeFromUrl)).toBe(false);

		expect(claimCaptureSession).toHaveBeenCalledTimes(1);
		expect(claimCaptureSession).toHaveBeenCalledWith('pairing-code');
		expect(removeCodeFromUrl).toHaveBeenCalledTimes(1);
		expect(readStoredCaptureCredential(storage)).toEqual({
			sessionId: 'session',
			uploadToken: 'upload-token',
			expiresAt: '2999-01-01T00:00:00.000Z'
		});
		expect(JSON.parse(storage.values.get(captureCredentialStorageKey) ?? '')).not.toHaveProperty(
			'code'
		);
	});

	it('replaces the stored credential when a new code is claimed', async () => {
		const storage = memoryStorage();
		claimCaptureSession
			.mockResolvedValueOnce({
				data: {
					session_id: 'first',
					upload_token: 'first-token',
					expires_at: '2999-01-01T00:00:00.000Z'
				}
			})
			.mockResolvedValueOnce({
				data: {
					session_id: 'second',
					upload_token: 'second-token',
					expires_at: '2999-01-02T00:00:00.000Z'
				}
			});
		const session = new CaptureSession();

		await session.claim('first-code', storage, vi.fn().mockResolvedValue(undefined));
		await session.claim('second-code', storage, vi.fn().mockResolvedValue(undefined));

		expect(session.credential).toEqual({
			sessionId: 'second',
			uploadToken: 'second-token',
			expiresAt: '2999-01-02T00:00:00.000Z'
		});
	});

	it('does not store a credential or remove the code when the claim fails', async () => {
		const storage = memoryStorage();
		const removeCodeFromUrl = vi.fn();
		claimCaptureSession.mockResolvedValue({
			error: {
				type: 'about:blank',
				title: 'código de pareamento inválido ou expirado',
				status: 401
			}
		});
		const session = new CaptureSession();

		expect(await session.claim('used-code', storage, removeCodeFromUrl)).toBe(false);

		expect(session.status).toBe('error');
		expect(session.credential).toBeNull();
		expect(storage.values.size).toBe(0);
		expect(removeCodeFromUrl).not.toHaveBeenCalled();
	});

	it('ignores an older claim after a newer code replaces it', async () => {
		const storage = memoryStorage();
		let resolveFirst: (value: unknown) => void = () => undefined;
		claimCaptureSession.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)));
		claimCaptureSession.mockResolvedValueOnce({
			data: {
				session_id: 'second',
				upload_token: 'second-token',
				expires_at: '2999-01-02T00:00:00.000Z'
			}
		});
		const session = new CaptureSession();

		const first = session.claim('first-code', storage, vi.fn().mockResolvedValue(undefined));
		await session.claim('second-code', storage, vi.fn().mockResolvedValue(undefined));
		resolveFirst({
			data: {
				session_id: 'first',
				upload_token: 'first-token',
				expires_at: '2999-01-01T00:00:00.000Z'
			}
		});
		await first;

		expect(session.credential?.sessionId).toBe('second');
	});
});
