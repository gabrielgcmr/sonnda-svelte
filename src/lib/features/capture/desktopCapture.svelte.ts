// src/lib/features/capture/desktopCapture.svelte.ts
import type { components } from '#lib/generated/openapi.js';
import {
	createDesktopCaptureSession,
	getCurrentDesktopCaptureSession,
	heartbeatDesktopCaptureSession,
	revokeDesktopCaptureSession
} from './desktopCaptureApi.js';

export const desktopHeartbeatIntervalMs = 20_000;

export type InboxCapture = components['schemas']['CaptureResponse'];
type SessionState = components['schemas']['SessionResponse'];

export class DesktopCaptureConnection {
	phase = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
	sessionId = $state<string | null>(null);
	pairingCode = $state<string | null>(null);
	mobilePresent = $state(false);
	claimed = $state(false);
	problem = $state<string | null>(null);
	ending = $state(false);

	#accountId: string | null = null;
	#accessToken: string | null = null;
	#active = false;
	#visible = true;
	#panelOpen = false;
	#started = false;
	#pairingExpiresAt: string | null = null;
	#generation = 0;
	#replacingCode = false;
	#heartbeatTimer: ReturnType<typeof setInterval> | null = null;

	constructor(private readonly now: () => number = Date.now) {}

	bindAccount(accountId: string | null, accessToken: string | null) {
		if (this.#accountId === accountId) {
			this.#accessToken = accessToken;
			return false;
		}

		const previousToken = this.#accessToken;
		const previousSessionId = this.sessionId;
		this.#accountId = accountId;
		this.#accessToken = accessToken;
		this.#discard();
		if (previousSessionId && previousToken) {
			void revokeDesktopCaptureSession(previousToken, previousSessionId);
		}
		return true;
	}

	activate(visible: boolean) {
		this.#active = true;
		this.#visible = visible;
	}

	deactivate() {
		this.#active = false;
		this.#stopHeartbeat();
	}

	setVisible(visible: boolean) {
		if (this.#visible === visible) return;
		this.#visible = visible;
		if (!visible) {
			this.#stopHeartbeat();
			return;
		}
		if (this.#started) this.#startHeartbeat();
	}

	setPanelOpen(open: boolean) {
		this.#panelOpen = open;
	}

	async connect() {
		if (!this.#accessToken || !this.#accountId) {
			this.phase = 'error';
			this.problem = 'Entre na conta para conectar o celular.';
			return;
		}

		this.#started = true;
		this.problem = null;
		if (this.sessionId && !this.#needsReplacementCode()) {
			this.phase = 'ready';
			this.#startHeartbeat();
			return;
		}

		this.phase = 'loading';
		const generation = this.#generation;
		const accountId = this.#accountId;
		try {
			await this.#ensureSession();
			if (generation !== this.#generation || this.#accountId !== accountId) return;
			this.phase = 'ready';
		} catch {
			if (generation !== this.#generation) return;
			this.phase = 'error';
			this.problem = 'Não foi possível abrir a captura pelo celular.';
		}
	}

	async renewPairing() {
		this.problem = null;
		this.phase = 'loading';
		const generation = this.#generation;
		try {
			await this.#createSession();
			if (generation !== this.#generation) return;
			this.#started = true;
			this.phase = 'ready';
		} catch {
			if (generation !== this.#generation) return;
			this.phase = 'error';
			this.problem = 'Não foi possível gerar um novo QR.';
		}
	}

	async end(options: { reopen?: boolean } = {}) {
		const token = this.#accessToken;
		const sessionId = this.sessionId;
		const reopen = options.reopen ?? false;
		this.ending = true;
		this.#stopHeartbeat();
		const generation = this.#discard();
		try {
			if (token && sessionId) {
				const result = await revokeDesktopCaptureSession(token, sessionId);
				if (generation !== this.#generation) return;
				if (!result.response.ok && result.response.status !== 404) {
					this.problem = 'Não foi possível encerrar a conexão.';
				}
			} else if (token && !reopen) {
				await this.#revokeCurrent(token, generation);
			}
			if (
				reopen &&
				this.#panelOpen &&
				this.#accessToken &&
				this.#accountId &&
				generation === this.#generation
			) {
				this.#started = true;
				await this.#createSession();
				if (generation !== this.#generation) return;
				this.phase = 'ready';
			}
		} finally {
			if (generation === this.#generation) this.ending = false;
		}
	}

	async #ensureSession() {
		const generation = this.#generation;
		const accountId = this.#accountId;
		if (this.sessionId && !this.#needsReplacementCode()) {
			await this.#beat();
			return;
		}
		if (!this.sessionId) {
			const current = await getCurrentDesktopCaptureSession(this.#accessToken ?? '');
			if (generation !== this.#generation || this.#accountId !== accountId) return;
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
		if (generation !== this.#generation || this.#accountId !== accountId) return;
		await this.#createSession();
	}

	async #createSession() {
		const generation = this.#generation;
		const token = this.#accessToken;
		const accountId = this.#accountId;
		if (!token || !accountId) throw new Error('capture session account is missing');
		const created = await createDesktopCaptureSession(token);
		if (generation !== this.#generation || this.#accountId !== accountId) return;
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
			this.#discard();
			if (this.#panelOpen && this.#accessToken && this.#accountId) {
				this.#started = true;
				await this.#createSession();
			}
			return;
		}
		if (!result.data) return;
		const pairingCode = this.claimed ? null : this.pairingCode;
		this.#applySession(result.data, pairingCode);
		await this.#replaceExpiredCode();
	}

	async #revokeCurrent(token: string, generation: number) {
		const current = await getCurrentDesktopCaptureSession(token);
		if (generation !== this.#generation || !current.data?.session_id) return;
		await revokeDesktopCaptureSession(token, current.data.session_id);
	}

	async #replaceExpiredCode() {
		if (this.#replacingCode || !this.#panelOpen || !this.#needsReplacementCode()) return;
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
		if (this.claimed || !this.#panelOpen) return false;
		if (!this.pairingCode || !this.#pairingExpiresAt) return true;
		return Date.parse(this.#pairingExpiresAt) <= this.now();
	}

	#applySession(session: SessionState, pairingCode: string | null) {
		this.sessionId = session.session_id;
		this.claimed = session.claimed_at !== null;
		this.mobilePresent = session.mobile_present;
		this.#pairingExpiresAt = session.pairing_expires_at;
		this.pairingCode = this.claimed ? null : pairingCode;
	}

	#discard() {
		this.#generation += 1;
		this.#stopHeartbeat();
		this.sessionId = null;
		this.pairingCode = null;
		this.#pairingExpiresAt = null;
		this.mobilePresent = false;
		this.claimed = false;
		this.#started = false;
		this.phase = 'idle';
		this.problem = null;
		return this.#generation;
	}

	#startHeartbeat() {
		this.#stopHeartbeat();
		if (
			!this.#active ||
			!this.#visible ||
			!this.#started ||
			!this.sessionId ||
			!this.#accessToken
		) {
			return;
		}
		void this.#beat();
		this.#heartbeatTimer = setInterval(() => {
			void this.#beat();
		}, desktopHeartbeatIntervalMs);
	}

	#stopHeartbeat() {
		if (!this.#heartbeatTimer) return;
		clearInterval(this.#heartbeatTimer);
		this.#heartbeatTimer = null;
	}
}

export async function revokeDesktopCaptureForSignOut(accessToken: string | null) {
	if (!accessToken) return;
	try {
		const current = await getCurrentDesktopCaptureSession(accessToken);
		const sessionId = current.data?.session_id;
		if (!sessionId) return;
		await revokeDesktopCaptureSession(accessToken, sessionId);
	} catch {
		// Sair da conta continua mesmo quando a captura não responde.
	}
}
