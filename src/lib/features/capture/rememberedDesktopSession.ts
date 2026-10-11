// src/lib/features/capture/rememberedDesktopSession.ts

export const rememberedDesktopSessionKey = 'sonnda.desktop-capture-session';

export type RememberedDesktopSession = {
	sessionId: string;
	accountId: string;
};

export type SessionStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readRememberedDesktopSession(
	storage: Pick<SessionStorageLike, 'getItem'>
): RememberedDesktopSession | null {
	const raw = storage.getItem(rememberedDesktopSessionKey);
	if (!raw) return null;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') return null;
		const record = parsed as Record<string, unknown>;
		if (typeof record.sessionId !== 'string' || record.sessionId.trim() === '') return null;
		if (typeof record.accountId !== 'string' || record.accountId.trim() === '') return null;
		return { sessionId: record.sessionId, accountId: record.accountId };
	} catch {
		return null;
	}
}

export function writeRememberedDesktopSession(
	storage: Pick<SessionStorageLike, 'setItem'>,
	session: RememberedDesktopSession
) {
	storage.setItem(rememberedDesktopSessionKey, JSON.stringify(session));
}

export function clearRememberedDesktopSession(storage: Pick<SessionStorageLike, 'removeItem'>) {
	storage.removeItem(rememberedDesktopSessionKey);
}

export const browserSessionStorage: SessionStorageLike = {
	getItem(key) {
		if (typeof sessionStorage === 'undefined') return null;
		return sessionStorage.getItem(key);
	},
	setItem(key, value) {
		if (typeof sessionStorage === 'undefined') return;
		sessionStorage.setItem(key, value);
	},
	removeItem(key) {
		if (typeof sessionStorage === 'undefined') return;
		sessionStorage.removeItem(key);
	}
};
