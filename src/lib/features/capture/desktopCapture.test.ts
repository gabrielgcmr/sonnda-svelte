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
	captureLibraryPageSize,
	captureLibraryPollIntervalMs,
	CaptureLibrary
} from './captureLibrary.svelte.js';
import {
	DesktopCaptureConnection,
	desktopHeartbeatIntervalMs,
	revokeDesktopCaptureForSignOut
} from './desktopCapture.svelte.js';

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

function page(items: unknown[], hasMore = false, offset = 0) {
	return response(200, { items, has_more: hasMore, limit: captureLibraryPageSize, offset });
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
	listCaptures.mockResolvedValue(page([pdfCapture]));
	revoke.mockResolvedValue(response(204));
});

afterEach(() => {
	vi.useRealTimers();
});

function connection(now = () => Date.parse('2026-10-11T12:00:00.000Z')) {
	const desktop = new DesktopCaptureConnection(now);
	desktop.bindAccount('account-a', 'token-a');
	desktop.activate(true);
	return desktop;
}

describe('DesktopCaptureConnection', () => {
	it('does not create a session when the workspace opens', async () => {
		connection();
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);
		expect(createSession).not.toHaveBeenCalled();
		expect(currentSession).not.toHaveBeenCalled();
	});

	it('starts the connection when captures open and keeps the heartbeat after the list closes', async () => {
		const desktop = connection();
		const library = new CaptureLibrary();
		library.bindAccount('account-a', 'token-a');
		desktop.setPanelOpen(true);

		await desktop.connect();
		await library.open();
		expect(createSession).toHaveBeenCalledWith('token-a');
		expect(desktop.pairingCode).toBe('qr-secret');

		const beats = heartbeat.mock.calls.length;
		const lists = listCaptures.mock.calls.length;
		desktop.setPanelOpen(false);
		library.close();
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);

		expect(heartbeat.mock.calls.length).toBeGreaterThan(beats);
		expect(listCaptures.mock.calls.length).toBe(lists);
	});

	it('adopts a claimed session from the backend without creating a new QR', async () => {
		const claimed = { claimed_at: '2026-10-11T12:00:00.000Z', mobile_present: true };
		currentSession.mockResolvedValue(sessionState(claimed));
		heartbeat.mockResolvedValue(sessionState(claimed));
		const desktop = connection();
		desktop.setPanelOpen(true);

		await desktop.connect();

		expect(createSession).not.toHaveBeenCalled();
		expect(desktop.pairingCode).toBeNull();
		expect(desktop.mobilePresent).toBe(true);
	});

	it('checks the connection immediately when the tab returns and stops on unmount without revoking', async () => {
		const desktop = connection();
		desktop.setPanelOpen(true);
		await desktop.connect();
		const beats = heartbeat.mock.calls.length;

		desktop.setVisible(false);
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs * 2);
		expect(heartbeat.mock.calls.length).toBe(beats);

		desktop.setVisible(true);
		await vi.advanceTimersByTimeAsync(0);
		expect(heartbeat.mock.calls.length).toBeGreaterThan(beats);

		const afterReturn = heartbeat.mock.calls.length;
		desktop.deactivate();
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);
		expect(heartbeat.mock.calls.length).toBe(afterReturn);
		expect(revoke).not.toHaveBeenCalled();
	});

	it('revokes the session when the connection ends and opens a new QR while captures stay open', async () => {
		const desktop = connection();
		desktop.setPanelOpen(true);
		await desktop.connect();

		await desktop.end({ reopen: true });

		expect(revoke).toHaveBeenCalledWith('token-a', 'session-1');
		expect(createSession).toHaveBeenCalledTimes(2);
		expect(desktop.sessionId).toBe('session-1');
	});

	it('drops the previous account and ignores a heartbeat that arrives late', async () => {
		const desktop = connection();
		desktop.setPanelOpen(true);
		await desktop.connect();
		let resolveBeat: (value: unknown) => void = () => {};
		heartbeat.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveBeat = resolve;
				})
		);
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);

		desktop.bindAccount('account-b', 'token-b');
		resolveBeat(sessionState());
		await vi.advanceTimersByTimeAsync(0);

		expect(revoke).toHaveBeenCalledWith('token-a', 'session-1');
		expect(desktop.sessionId).toBeNull();
	});

	it('replaces an expired QR only while captures are open', async () => {
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
		const desktop = connection(() => now);
		desktop.setPanelOpen(true);
		await desktop.connect();

		desktop.setPanelOpen(false);
		now += 1_000;
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);
		expect(desktop.sessionId).toBe('session-1');

		desktop.setPanelOpen(true);
		replace = true;
		await vi.advanceTimersByTimeAsync(desktopHeartbeatIntervalMs);
		expect(desktop.sessionId).toBe('session-2');
		expect(desktop.pairingCode).toBe('qr-next');
	});
});

describe('CaptureLibrary', () => {
	it('keeps the same items when polling returns unchanged captures', async () => {
		listCaptures
			.mockResolvedValueOnce(page([pdfCapture]))
			.mockResolvedValueOnce(page([{ ...pdfCapture }]))
			.mockResolvedValueOnce(page([{ ...pdfCapture, original_filename: 'renomeado.pdf' }]));
		const library = new CaptureLibrary();
		library.bindAccount('account-a', 'token-a');

		await library.open();
		const originalItems = library.items;
		await library.refresh();
		expect(library.items).toBe(originalItems);
		expect(library.items[0]).toBe(pdfCapture);

		await library.refresh();
		expect(library.items[0].original_filename).toBe('renomeado.pdf');
		expect(library.items).not.toBe(originalItems);
		library.close();
	});

	it('keeps the loaded files when a later update fails and appends the next page', async () => {
		const second = { ...pdfCapture, id: 'capture-2', original_filename: 'outro.pdf' };
		listCaptures
			.mockResolvedValueOnce(page([pdfCapture], true))
			.mockResolvedValueOnce(response(500))
			.mockResolvedValueOnce(page([second], false, captureLibraryPageSize));
		const library = new CaptureLibrary();
		library.bindAccount('account-a', 'token-a');

		await library.open();
		await vi.advanceTimersByTimeAsync(captureLibraryPollIntervalMs);
		expect(library.items).toEqual([pdfCapture]);
		expect(library.problem).toBe('Não foi possível atualizar os arquivos recebidos.');

		await library.loadMore();
		expect(library.items.map((item) => item.id)).toEqual(['capture-1', 'capture-2']);
		expect(listCaptures).toHaveBeenLastCalledWith('token-a', {
			limit: captureLibraryPageSize,
			offset: 1
		});
	});

	it('discards a list response from the previous account', async () => {
		let resolveList: (value: unknown) => void = () => {};
		listCaptures.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveList = resolve;
				})
		);
		const library = new CaptureLibrary();
		library.bindAccount('account-a', 'token-a');
		const pending = library.open();

		library.bindAccount('account-b', 'token-b');
		resolveList(page([pdfCapture]));
		await pending;

		expect(library.items).toEqual([]);
	});
});

describe('revokeDesktopCaptureForSignOut', () => {
	it('revokes the current server session when the workspace is not mounted', async () => {
		currentSession.mockResolvedValue(sessionState({ session_id: 'session-9' }));

		await revokeDesktopCaptureForSignOut('token-a');

		expect(revoke).toHaveBeenCalledWith('token-a', 'session-9');
	});
});
