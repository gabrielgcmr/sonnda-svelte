// src/lib/features/capture/desktopCapture.svelte.ts
import type { components } from '#lib/generated/openapi.js';
import {
	createDesktopCaptureSession,
	getCurrentDesktopCaptureSession,
	heartbeatDesktopCaptureSession,
	listInboxCaptures,
	revokeDesktopCaptureSession
} from './desktopCaptureApi.js';
import {
	browserSessionStorage,
	clearRememberedDesktopSession,
	readRememberedDesktopSession,
	writeRememberedDesktopSession,
	type SessionStorageLike
} from './rememberedDesktopSession.js';

export const desktopHeartbeatIntervalMs = 20_000;
export const inboxPollIntervalMs = 5_000;

export type InboxCapture = components['schemas']['CaptureResponse'];
type SessionState = components['schemas']['SessionResponse'];

export class DesktopCaptureInbox {
	panelOpen = $state(false);
	phase = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
	sessionId = $state<string | null>(null);
	pairingCode = $state<string | null>(null);
	mobilePresent = $state(false);
	claimed = $state(false);
	captures = $state.raw<InboxCapture[]>([]);
	problem = $state<string | null>(null);
	ending = $state(false);

	#accountId: string | null = null;
	#accessToken: string | null = null;
	#pageActive = false;
	#visible = true;
	#pairingExpiresAt: string | null = null;
	#generation = 0;
	#replacingCode = false;
	#heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	#pollTimer: ReturnType<typeof setInterval> | null = null;

	constructor(
		private readonly storage: SessionStorageLike,
		private readonly now: () => number = Date.now
	) {}

	get accessToken() {
		return this.#accessToken;
	}

	activate(visible: boolean) {
		this.#pageActive = true;
		this.#visible = visible;
		this.#resumeRemembered();
	}

	deactivate() {
		this.#pageActive = false;
		this.panelOpen = false;
		this.#stopHeartbeat();
		this.#stopPolling();
	}

	syncAccount(accountId: string | null, accessToken: string | null) {
		if (this.#accountId === accountId) {
			this.#accessToken = accessToken;
			this.#resumeRemembered();
			return;
		}

		const previousToken = this.#accessToken;
		const previousSessionId = this.sessionId;
		this.#accountId = accountId;
		this.#accessToken = accessToken;
		if (previousSessionId && previousToken) {
			void this.endConnection({
				reopen: false,
				accessToken: previousToken,
				sessionId: previousSessionId,
				clearCaptures: true
			}).then(() => {
				if (this.#accountId === accountId) this.#resumeRemembered();
			});
			return;
		}

		this.#clearLocalSession(true);
		this.#resumeRemembered();
	}

	setVisible(visible: boolean) {
		if (this.#visible === visible) return;
		this.#visible = visible;
		if (!visible) {
			this.#stopHeartbeat();
			this.#stopPolling();
			return;
		}
		this.#startHeartbeat();
		if (!this.panelOpen) return;
		void this.#loadCaptures();
		this.#startPolling();
	}

	async openPanel() {
		this.panelOpen = true;
		this.problem = null;
		if (!this.#accessToken || !this.#accountId) {
			this.phase = 'error';
			this.problem = 'Entre na conta para conectar o celular.';
			return;
		}

		this.phase = 'loading';
		const generation = this.#generation;
		try {
			await this.#ensureSession();
			if (generation !== this.#generation || !this.panelOpen) return;
			await this.#loadCaptures();
			if (generation !== this.#generation || !this.panelOpen) return;
			this.phase = 'ready';
			this.#startPolling();
		} catch {
			if (generation !== this.#generation) return;
			this.phase = 'error';
			this.problem = 'Não foi possível abrir a captura pelo celular.';
		}
	}

	closePanel() {
		this.panelOpen = false;
		this.#stopPolling();
	}

	async renewPairing() {
		this.problem = null;
		this.phase = 'loading';
		try {
			await this.#createSession();
			this.phase = 'ready';
			this.#startPolling();
		} catch {
			this.phase = 'error';
			this.problem = 'Não foi possível gerar um novo QR.';
		}
	}

	async endConnection(
		options: {
			reopen?: boolean;
			accessToken?: string | null;
			sessionId?: string | null;
			clearCaptures?: boolean;
		} = {}
	) {
		const token = options.accessToken === undefined ? this.#accessToken : options.accessToken;
		const sessionId = options.sessionId === undefined ? this.sessionId : options.sessionId;
		const reopen = options.reopen ?? false;
		this.ending = true;
		this.#stopHeartbeat();
		this.#stopPolling();
		this.#clearLocalSession(options.clearCaptures ?? false);
		try {
			if (token && sessionId) {
				const result = await revokeDesktopCaptureSession(token, sessionId);
				if (!result.response.ok && result.response.status !== 404) {
					this.problem = 'Não foi possível encerrar a conexão.';
				}
			}
			if (reopen && this.panelOpen && this.#accessToken && this.#accountId) {
				await this.#createSession();
				await this.#loadCaptures();
				this.phase = 'ready';
				this.#startPolling();
			}
		} finally {
			this.ending = false;
		}
	}

	async #ensureSession() {
		if (this.sessionId && !this.#needsReplacementCode()) {
			await this.#beat();
			return;
		}
		if (!this.sessionId) {
			const current = await getCurrentDesktopCaptureSession(this.#accessToken ?? '');
			if (current.response.status === 404) {
				await this.#createSession();
				return;
			}
			if (!current.data) throw new Error('current capture session failed');
			if (current.data.claimed_at) {
				this.#applySession(current.data, null);
				this.#startHeartbeat();
				return;
			}
		}
		await this.#createSession();
	}

	async #createSession() {
		const token = this.#accessToken;
		const accountId = this.#accountId;
		if (!token || !accountId) throw new Error('capture session account is missing');
		const created = await createDesktopCaptureSession(token);
		if (!created.data) throw new Error('capture session was not created');
		this.#applySession(created.data, created.data.pairing_code);
		this.#startHeartbeat();
	}

	async #beat() {
		const generation = this.#generation;
		const sessionId = this.sessionId;
		const token = this.#accessToken;
		if (!sessionId || !token) return;
		const result = await heartbeatDesktopCaptureSession(token, sessionId);
		if (generation !== this.#generation || this.sessionId !== sessionId) return;
		if (result.response.status === 404) {
			this.#clearLocalSession(false);
			return;
		}
		if (!result.data) return;
		const pairingCode = this.claimed ? null : this.pairingCode;
		this.#applySession(result.data, pairingCode);
		await this.#replaceExpiredCode();
	}

	async #loadCaptures() {
		const generation = this.#generation;
		const token = this.#accessToken;
		if (!token) return;
		const result = await listInboxCaptures(token);
		if (generation !== this.#generation) return;
		if (!result.data) {
			this.problem = 'Não foi possível atualizar os arquivos recebidos.';
			return;
		}
		this.captures = result.data.items ?? [];
		if (this.problem === 'Não foi possível atualizar os arquivos recebidos.') this.problem = null;
	}

	#resumeRemembered() {
		if (!this.#pageActive || !this.#accountId || !this.#accessToken || this.sessionId) return;
		const remembered = readRememberedDesktopSession(this.storage);
		if (!remembered || remembered.accountId !== this.#accountId) return;
		this.sessionId = remembered.sessionId;
		this.#startHeartbeat();
	}

	#applySession(session: SessionState, pairingCode: string | null) {
		this.sessionId = session.session_id;
		this.claimed = session.claimed_at !== null;
		this.mobilePresent = session.mobile_present;
		this.#pairingExpiresAt = session.pairing_expires_at;
		this.pairingCode = this.claimed ? null : pairingCode;
		if (this.#accountId) {
			writeRememberedDesktopSession(this.storage, {
				sessionId: session.session_id,
				accountId: this.#accountId
			});
		}
	}

	async #replaceExpiredCode() {
		if (this.#replacingCode || !this.panelOpen || !this.#needsReplacementCode()) return;
		this.#replacingCode = true;
		try {
			await this.#createSession();
		} catch {
			this.problem = 'Não foi possível renovar o QR.';
		} finally {
			this.#replacingCode = false;
		}
	}

	#needsReplacementCode() {
		if (this.claimed) return false;
		if (!this.pairingCode) return true;
		if (!this.#pairingExpiresAt) return true;
		return Date.parse(this.#pairingExpiresAt) <= this.now();
	}

	#clearLocalSession(clearCaptures: boolean) {
		this.#generation += 1;
		this.sessionId = null;
		this.pairingCode = null;
		this.#pairingExpiresAt = null;
		this.mobilePresent = false;
		this.claimed = false;
		if (clearCaptures) this.captures = [];
		clearRememberedDesktopSession(this.storage);
	}

	#startHeartbeat() {
		this.#stopHeartbeat();
		if (!this.#pageActive || !this.#visible || !this.sessionId || !this.#accessToken) return;
		void this.#beat();
		this.#heartbeatTimer = setInterval(() => {
			void this.#beat();
		}, desktopHeartbeatIntervalMs);
	}

	#startPolling() {
		this.#stopPolling();
		if (!this.panelOpen || !this.#visible || !this.#accessToken) return;
		this.#pollTimer = setInterval(() => {
			void this.#loadCaptures();
		}, inboxPollIntervalMs);
	}

	#stopHeartbeat() {
		if (!this.#heartbeatTimer) return;
		clearInterval(this.#heartbeatTimer);
		this.#heartbeatTimer = null;
	}

	#stopPolling() {
		if (!this.#pollTimer) return;
		clearInterval(this.#pollTimer);
		this.#pollTimer = null;
	}
}

let attachedInbox: DesktopCaptureInbox | null = null;

export function attachDesktopCaptureInbox(inbox: DesktopCaptureInbox) {
	attachedInbox = inbox;
	return () => {
		if (attachedInbox === inbox) attachedInbox = null;
	};
}

export async function revokeDesktopCaptureForSignOut(
	accessToken: string | null,
	storage: SessionStorageLike = browserSessionStorage
) {
	try {
		if (attachedInbox) {
			await attachedInbox.endConnection({
				reopen: false,
				accessToken,
				clearCaptures: true
			});
			return;
		}
		const remembered = readRememberedDesktopSession(storage);
		if (remembered && accessToken) {
			await revokeDesktopCaptureSession(accessToken, remembered.sessionId);
		}
		clearRememberedDesktopSession(storage);
	} catch {
		clearRememberedDesktopSession(storage);
	}
}
