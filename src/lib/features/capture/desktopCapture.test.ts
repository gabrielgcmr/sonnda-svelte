// src/lib/features/capture/desktopCapture.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createSession, currentSession, heartbeat, revoke, listCaptures } = vi.hoisted(() => ({
	createSession: vi.fn(),
	currentSession: vi.fn(),
	heartbeat: vi.fn(),
	revoke: vi.fn(),
	listCaptures: vi.fn()
}));

vi.mock('./desktopCaptureApi.js', () => ({
	createDesktopCaptureSession: createSession,
	getCurrentDesktopCaptureSession: currentSession,
	heartbeatDesktopCaptureSession: heartbeat,
	revokeDesktopCaptureSession: revoke,
	listInboxCaptures: listCaptures
}));

import {
	DesktopCaptureInbox,
	desktopHeartbeatIntervalMs,
	revokeDesktopCaptureForSignOut
} from './desktopCapture.svelte.js';
import {
	readRememberedDesktopSession,
	rememberedDesktopSessionKey,
	writeRememberedDesktopSession,
	type SessionStorageLike
} from './rememberedDesktopSession.js';

const pdfCapture = {
	id: 'capture-1',
	capture_session_id: 'session-1',
	created_at: '2026-10-11T12:00:00.000Z',
	expires_at: '2026-10-12T12:00:00.000Z',
	mime_type: 'application/pdf',
	original_filename: 'hemograma.pdf',
	size_bytes: 1200,
	status: 'available'
};

function memoryStorage(): SessionStorageLike {
	const values = new Map<string, string>();
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key)
	};
}

function response(status: number, data?: unknown) {
	return { data, response: { ok: status >= 200 && status < 300, status } };
}

function createdSession(overrides: Record<string, unknown> = {}) {
	return response(201, {
		session_id: 'session-1',
		pairing_code: 'qr-secret',
		pairing_expires_at: '2999-01-01T00:00:00.000Z',
		claimed_at: null,
		mobile_present: false,
		...overrides
	});
}

function sessionState(overrides: Record<string, unknown> = {}) {
	return response(200, {
		session_id: 'session-1',
		pairing_expires_at: '2999-01-01T00:00:00.000Z',
		claimed_at: null,
		mobile_present: false,
		...overrides
	});
}

beforeEach(() => {
	createSession.mockReset();
	currentSession.mockReset();
	heartbeat.mockReset();
	revoke.mockReset();
	listCaptures.mockReset();
	vi.useFakeTimers();
	currentSession.mockResolvedValue(response(404));
	createSession.mockResolvedValue(createdSession());
	heartbeat.mockResolvedValue(sessionState());
	listCaptures.mockResolvedValue(response(200, { items: [pdfCapture] }));
	revoke.mockResolvedValue(response(204));
});

afterEach(() => {
	vi.useRealTimers();
});

async function openInbox(
	storage = memoryStorage(),
	now = () => Date.parse('2026-10-11T12:00:00.000Z')
) {
	const inbox = new DesktopCaptureInbox(storage, now);
	inbox.syncAccount('account-a', 'token-a');
	inbox.activate(true);
	await inbox.openPanel();
	await vi.advanceTimersByTimeAsync(0);
	return inbox;
}

describe('DesktopCaptureInbox', () => {
	it('creates a session and shows its pairing code when the panel opens', async () => {
		const storage = memoryStorage();
		const inbox = await openInbox(storage);

		expect(createSession).toHaveBeenCalledWith('token-a');
		expect(inbox.pairingCode).toBe('qr-secret');
		expect(inbox.mobilePresent).toBe(false);
		expect(inbox.captures).toEqual([pdfCapture]);
		expect(readRememberedDesktopSession(storage)).toEqual({
			sessionId: 'session-1',
			accountId: 'account-a'
		});
	});

	it('resumes a claimed session without creating a new QR', async () => {
		const claimed = { claimed_at: '2026-10-11T12:00:00.000Z', mobile_present: true };
		currentSession.mockResolvedValue(sessionState(claimed));
		heartbeat.mockResolvedValue(sessionState(claimed));
		const inbox = new DesktopCaptureInbox(memoryStorage());
		inbox.syncAccount('account-a', 'token-a');
		inbox.activate(true);

		await inbox.openPanel();

		expect(createSession).not.toHaveBeenCalled();
		expect(inbox.pairingCode).toBeNull();
		expect(inbox.mobilePresent).toBe(true);
		expect(inbox.captures).toEqual([pdfCapture]);
	});

	it('keeps received files when the phone disconnects', async () => {
		heartbeat.mockResolvedValue(
			sessionState({ claimed_at: '2026-10-11T12:00:00.000Z', mobile_present: true })
		);
		const inbox = await openInbox();
		expect(inbox.mobilePresent).toBe(true);

		heartbeat.mockResolvedValue(
			sessionState({ claimed_at: '2026-10-11T12:00:00.000Z', mobile_present: false })
		);
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);

		expect(inbox.mobilePresent).toBe(false);
		expect(inbox.pairingCode).toBeNull();
		expect(inbox.captures).toEqual([pdfCapture]);
	});

	it('pauses the heartbeat while the page is hidden and does not revoke on leave', async () => {
		const inbox = await openInbox();
		const callsAfterOpen = heartbeat.mock.calls.length;

		inbox.setVisible(false);
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs * 3);
		expect(heartbeat.mock.calls.length).toBe(callsAfterOpen);

		inbox.setVisible(true);
		await vi.advanceTimersByTimeAsync(0);
		expect(heartbeat.mock.calls.length).toBeGreaterThan(callsAfterOpen);

		inbox.deactivate();
		const callsAfterLeave = heartbeat.mock.calls.length;
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs * 2);
		expect(heartbeat.mock.calls.length).toBe(callsAfterLeave);
		expect(revoke).not.toHaveBeenCalled();
	});

	it('revokes the session when the connection ends and keeps the received files', async () => {
		const inbox = await openInbox();

		await inbox.endConnection({ reopen: true });

		expect(revoke).toHaveBeenCalledWith('token-a', 'session-1');
		expect(createSession).toHaveBeenCalledTimes(2);
		expect(inbox.captures).toEqual([pdfCapture]);
	});

	it('revokes the previous account session before using the next account', async () => {
		const inbox = await openInbox();

		inbox.syncAccount('account-b', 'token-b');
		await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith('token-a', 'session-1'));

		expect(inbox.captures).toEqual([]);
		expect(inbox.sessionId).toBeNull();
	});

	it('replaces an expired unpaired code while the panel stays open', async () => {
		let now = Date.parse('2026-10-11T12:00:00.000Z');
		const firstExpiry = new Date(now + 1_000).toISOString();
		let replace = false;
		createSession.mockImplementation(() =>
			createdSession(
				replace
					? {
							session_id: 'session-2',
							pairing_code: 'qr-next',
							pairing_expires_at: '2999-01-01T00:00:00.000Z'
						}
					: { pairing_expires_at: firstExpiry }
			)
		);
		heartbeat.mockImplementation((_token: string, sessionId: string) =>
			sessionState({
				session_id: sessionId,
				pairing_expires_at: sessionId === 'session-2' ? '2999-01-01T00:00:00.000Z' : firstExpiry
			})
		);
		const inbox = await openInbox(memoryStorage(), () => now);
		expect(inbox.pairingCode).toBe('qr-secret');

		now += 1_000;
		replace = true;
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);

		expect(inbox.sessionId).toBe('session-2');
		expect(inbox.pairingCode).toBe('qr-next');
	});
});

describe('revokeDesktopCaptureForSignOut', () => {
	it('revokes the remembered session when the exams page is not open', async () => {
		const storage = memoryStorage();
		writeRememberedDesktopSession(storage, { sessionId: 'session-9', accountId: 'account-a' });

		await revokeDesktopCaptureForSignOut('token-a', storage);

		expect(revoke).toHaveBeenCalledWith('token-a', 'session-9');
		expect(storage.getItem(rememberedDesktopSessionKey)).toBeNull();
	});
});
