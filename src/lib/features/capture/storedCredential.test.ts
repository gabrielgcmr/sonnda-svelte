// src/lib/features/capture/storedCredential.test.ts
import { describe, expect, it } from 'vitest';
import {
	captureCredentialStorageKey,
	captureLinkMode,
	clearStoredCaptureCredential,
	readStoredCaptureCredential,
	writeStoredCaptureCredential
} from './storedCredential';

const now = new Date('2026-10-10T12:00:00.000Z');

function storageWith(value: string | null): Pick<Storage, 'getItem'> {
	return {
		getItem(key) {
			expect(key).toBe(captureCredentialStorageKey);
			return value;
		}
	};
}

describe('readStoredCaptureCredential', () => {
	it('returns null without storage or a saved value', () => {
		expect(readStoredCaptureCredential(null, now)).toBeNull();
		expect(readStoredCaptureCredential(storageWith(null), now)).toBeNull();
	});

	it('returns null for malformed, incomplete, or expired credentials', () => {
		expect(readStoredCaptureCredential(storageWith('not-json'), now)).toBeNull();
		expect(readStoredCaptureCredential(storageWith('null'), now)).toBeNull();
		expect(
			readStoredCaptureCredential(
				storageWith(JSON.stringify({ session_id: 'session', upload_token: 'token' })),
				now
			)
		).toBeNull();
		expect(
			readStoredCaptureCredential(
				storageWith(
					JSON.stringify({
						session_id: 'session',
						upload_token: 'token',
						expires_at: '2026-10-10T11:59:59.000Z'
					})
				),
				now
			)
		).toBeNull();
	});

	it('reads an unexpired credential without exposing it beyond the parsed fields', () => {
		expect(
			readStoredCaptureCredential(
				storageWith(
					JSON.stringify({
						session_id: 'session',
						upload_token: 'token',
						expires_at: '2026-10-10T12:00:01.000Z'
					})
				),
				now
			)
		).toEqual({
			sessionId: 'session',
			uploadToken: 'token',
			expiresAt: '2026-10-10T12:00:01.000Z'
		});
	});
});

describe('writeStoredCaptureCredential', () => {
	it('stores only the session, token, and expiration', () => {
		let saved: string | null = null;
		const storage = {
			getItem: () => saved,
			setItem(_key: string, value: string) {
				saved = value;
			}
		};

		writeStoredCaptureCredential(storage, {
			sessionId: 'session',
			uploadToken: 'token',
			expiresAt: '2026-10-10T18:00:00.000Z'
		});

		expect(JSON.parse(saved ?? '')).toEqual({
			session_id: 'session',
			upload_token: 'token',
			expires_at: '2026-10-10T18:00:00.000Z'
		});
		expect(readStoredCaptureCredential(storage, now)).toEqual({
			sessionId: 'session',
			uploadToken: 'token',
			expiresAt: '2026-10-10T18:00:00.000Z'
		});

		clearStoredCaptureCredential({
			removeItem(key) {
				expect(key).toBe(captureCredentialStorageKey);
				saved = null;
			}
		});
		expect(readStoredCaptureCredential(storage, now)).toBeNull();
	});
});

describe('captureLinkMode', () => {
	it('asks for a new QR only when there is no code, no credential, and no claim in progress', () => {
		expect(
			captureLinkMode({
				code: '',
				storageChecked: false,
				hasCredential: false,
				claimStatus: 'idle'
			})
		).toBe('checking');
		expect(
			captureLinkMode({
				code: '   ',
				storageChecked: true,
				hasCredential: false,
				claimStatus: 'idle'
			})
		).toBe('needs-qr');
		expect(
			captureLinkMode({
				code: '',
				storageChecked: true,
				hasCredential: true,
				claimStatus: 'ready'
			})
		).toBe('resumed');
		expect(
			captureLinkMode({
				code: ' pairing ',
				storageChecked: true,
				hasCredential: false,
				claimStatus: 'error'
			})
		).toBe('needs-qr');
		expect(
			captureLinkMode({
				code: ' pairing ',
				storageChecked: true,
				hasCredential: false,
				claimStatus: 'claiming'
			})
		).toBe('claiming');
	});
});
