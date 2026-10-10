// src/lib/features/capture/storedCredential.test.ts
import { describe, expect, it } from 'vitest';
import {
	captureCredentialStorageKey,
	captureLinkMode,
	readStoredCaptureCredential
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

describe('captureLinkMode', () => {
	it('asks for a new QR only after confirming there is no code and no credential', () => {
		expect(captureLinkMode({ code: '', storageChecked: false, hasCredential: false })).toBe(
			'checking'
		);
		expect(captureLinkMode({ code: '   ', storageChecked: true, hasCredential: false })).toBe(
			'needs-qr'
		);
		expect(captureLinkMode({ code: '', storageChecked: true, hasCredential: true })).toBe(
			'resumed'
		);
		expect(
			captureLinkMode({ code: ' pairing ', storageChecked: false, hasCredential: false })
		).toBe('opened');
	});
});
