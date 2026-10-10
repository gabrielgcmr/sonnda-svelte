// src/lib/features/capture/capturePresence.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMobileHeartbeat } = vi.hoisted(() => ({
	sendMobileHeartbeat: vi.fn()
}));

vi.mock('./captureApi.js', () => ({
	sendMobileHeartbeat,
	captureCredentialRejected: (error: { status?: number } | undefined) =>
		error?.status === 401 || error?.status === 404
}));

import { CapturePresence, mobileHeartbeatIntervalMs } from './capturePresence.svelte.js';
import { captureCredentialStorageKey, readStoredCaptureCredential } from './storedCredential.js';

const credential = {
	sessionId: 'session',
	uploadToken: 'upload-token',
	expiresAt: '2999-01-01T00:00:00.000Z'
};

function memoryStorage(initial = credential) {
	let raw: string | null = JSON.stringify({
		session_id: initial.sessionId,
		upload_token: initial.uploadToken,
		expires_at: initial.expiresAt
	});
	return {
		getItem: (key: string) => (key === captureCredentialStorageKey ? raw : null),
		setItem: (_key: string, value: string) => {
			raw = value;
		},
		removeItem: (key: string) => {
			if (key === captureCredentialStorageKey) raw = null;
		}
	};
}

const present = {
	data: { desktop_present: true, mobile_present: true, connected: true }
};
const computerAway = {
	data: { desktop_present: false, mobile_present: true, connected: false }
};

beforeEach(() => {
	sendMobileHeartbeat.mockReset();
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('CapturePresence', () => {
	it('beats immediately and every 20 seconds while the page is visible', async () => {
		sendMobileHeartbeat.mockResolvedValue(present);
		const presence = new CapturePresence();

		presence.arm(credential, memoryStorage(), true, vi.fn());
		await vi.advanceTimersByTimeAsync(0);
		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(1);
		expect(sendMobileHeartbeat).toHaveBeenCalledWith('session', 'upload-token');

		await vi.advanceTimersByTimeAsync(mobileHeartbeatIntervalMs);
		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(2);
		expect(presence.desktopPresent).toBe(true);
		expect(presence.connected).toBe(true);
	});

	it('pauses the interval while hidden and beats as soon as the page returns', async () => {
		sendMobileHeartbeat.mockResolvedValue(present);
		const presence = new CapturePresence();
		presence.arm(credential, memoryStorage(), true, vi.fn());
		await vi.advanceTimersByTimeAsync(0);

		presence.setVisible(false);
		await vi.advanceTimersByTimeAsync(mobileHeartbeatIntervalMs * 3);
		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(1);

		presence.setVisible(true);
		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(mobileHeartbeatIntervalMs);
		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(3);
	});

	it('stops the timer on unmount without deleting the credential', async () => {
		sendMobileHeartbeat.mockResolvedValue(present);
		const storage = memoryStorage();
		const presence = new CapturePresence();
		presence.arm(credential, storage, true, vi.fn());
		await vi.advanceTimersByTimeAsync(0);

		presence.stop();
		await vi.advanceTimersByTimeAsync(mobileHeartbeatIntervalMs * 2);

		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(1);
		expect(readStoredCaptureCredential(storage)).toEqual(credential);
	});

	it('keeps the credential when the computer is away', async () => {
		sendMobileHeartbeat.mockResolvedValue(computerAway);
		const storage = memoryStorage();
		const onEnded = vi.fn();
		const presence = new CapturePresence();

		presence.arm(credential, storage, true, onEnded);
		await vi.advanceTimersByTimeAsync(0);

		expect(presence.desktopPresent).toBe(false);
		expect(presence.connected).toBe(false);
		expect(presence.ended).toBe(false);
		expect(onEnded).not.toHaveBeenCalled();
		expect(readStoredCaptureCredential(storage)).toEqual(credential);
	});

	it('clears the credential when the heartbeat rejects it', async () => {
		sendMobileHeartbeat.mockResolvedValue({
			error: {
				type: 'about:blank',
				title: 'credencial de captura inválida ou expirada',
				status: 401
			}
		});
		const storage = memoryStorage();
		const onEnded = vi.fn();
		const presence = new CapturePresence();

		presence.arm(credential, storage, true, onEnded);
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(mobileHeartbeatIntervalMs);

		expect(onEnded).toHaveBeenCalledTimes(1);
		expect(presence.ended).toBe(true);
		expect(readStoredCaptureCredential(storage)).toBeNull();
		expect(sendMobileHeartbeat).toHaveBeenCalledTimes(1);
	});

	it('ignores a rejected heartbeat from the credential that was just replaced', async () => {
		let rejectFirst: (value: unknown) => void = () => undefined;
		sendMobileHeartbeat.mockReturnValueOnce(new Promise((resolve) => (rejectFirst = resolve)));
		sendMobileHeartbeat.mockResolvedValueOnce(present);
		const storage = memoryStorage();
		const onEnded = vi.fn();
		const presence = new CapturePresence();
		const replacement = { ...credential, sessionId: 'next', uploadToken: 'next-token' };

		presence.arm(credential, storage, true, onEnded);
		presence.arm(replacement, storage, true, onEnded);
		rejectFirst({ error: { type: 'about:blank', title: 'expirada', status: 401 } });
		await vi.advanceTimersByTimeAsync(0);

		expect(onEnded).not.toHaveBeenCalled();
		expect(presence.desktopPresent).toBe(true);
		expect(sendMobileHeartbeat).toHaveBeenLastCalledWith('next', 'next-token');
		expect(readStoredCaptureCredential(storage)?.sessionId).toBe('session');
	});
});
