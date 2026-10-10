// src/lib/features/capture/storedCredential.ts

export const captureCredentialStorageKey = 'sonnda-capture-credential';

export type StoredCaptureCredential = {
	sessionId: string;
	uploadToken: string;
	expiresAt: string;
};

type StorageReader = Pick<Storage, 'getItem'>;

export function readStoredCaptureCredential(
	storage: StorageReader | null,
	now = new Date()
): StoredCaptureCredential | null {
	if (!storage) return null;

	let parsed: unknown;
	try {
		const raw = storage.getItem(captureCredentialStorageKey);
		if (!raw) return null;
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (!parsed || typeof parsed !== 'object') return null;

	const record = parsed as Record<string, unknown>;
	const sessionId = record.session_id;
	const uploadToken = record.upload_token;
	const expiresAt = record.expires_at;
	if (typeof sessionId !== 'string' || sessionId.trim() === '') return null;
	if (typeof uploadToken !== 'string' || uploadToken.trim() === '') return null;
	if (typeof expiresAt !== 'string' || expiresAt.trim() === '') return null;

	const expires = new Date(expiresAt);
	if (Number.isNaN(expires.getTime()) || expires.getTime() <= now.getTime()) return null;

	return { sessionId, uploadToken, expiresAt };
}

export type CaptureLinkMode = 'checking' | 'needs-qr' | 'opened' | 'resumed';

export function captureLinkMode(input: {
	code: string;
	storageChecked: boolean;
	hasCredential: boolean;
}): CaptureLinkMode {
	if (input.code.trim() !== '') return 'opened';
	if (!input.storageChecked) return 'checking';
	if (input.hasCredential) return 'resumed';
	return 'needs-qr';
}
