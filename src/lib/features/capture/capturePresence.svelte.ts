// src/lib/features/capture/capturePresence.svelte.ts
import {
	captureCredentialRejected,
	sendMobileHeartbeat,
	type MobileHeartbeatState
} from './captureApi.js';
import { clearStoredCaptureCredential, type StoredCaptureCredential } from './storedCredential.js';

export const mobileHeartbeatIntervalMs = 20_000;

type HeartbeatStorage = Pick<Storage, 'removeItem'>;

export class CapturePresence {
	desktopPresent = $state<boolean | null>(null);
	mobilePresent = $state<boolean | null>(null);
	connected = $state<boolean | null>(null);
	ended = $state(false);

	#timer: ReturnType<typeof setInterval> | null = null;
	#credential: StoredCaptureCredential | null = null;
	#storage: HeartbeatStorage | null = null;
	#onEnded: (() => void) | null = null;
	#visible = true;
	#armed = false;
	#version = 0;

	arm(
		credential: StoredCaptureCredential,
		storage: HeartbeatStorage,
		visible: boolean,
		onEnded: () => void
	) {
		const sameCredential =
			this.#armed &&
			this.#credential?.sessionId === credential.sessionId &&
			this.#credential.uploadToken === credential.uploadToken;
		this.#credential = credential;
		this.#storage = storage;
		this.#onEnded = onEnded;
		this.ended = false;
		if (sameCredential) {
			if (visible !== this.#visible) this.setVisible(visible);
			return;
		}

		this.#version += 1;
		this.#armed = true;
		this.#visible = visible;
		this.desktopPresent = null;
		this.mobilePresent = null;
		this.connected = null;
		this.#clearTimer();
		if (visible) this.#schedule();
	}

	setVisible(visible: boolean) {
		if (this.#visible === visible) return;
		this.#visible = visible;
		if (!this.#armed) return;
		if (!visible) {
			this.#clearTimer();
			return;
		}
		this.#schedule();
	}

	stop() {
		this.#armed = false;
		this.#version += 1;
		this.#clearTimer();
	}

	async #beat() {
		const credential = this.#credential;
		const version = this.#version;
		if (!credential || !this.#armed) return;

		const { data, error } = await sendMobileHeartbeat(credential.sessionId, credential.uploadToken);
		if (version !== this.#version || !this.#armed) return;

		if (captureCredentialRejected(error)) {
			this.#finishEnded();
			return;
		}
		if (!data) return;
		this.#apply(data);
	}

	#schedule() {
		this.#clearTimer();
		void this.#beat();
		this.#timer = setInterval(() => {
			void this.#beat();
		}, mobileHeartbeatIntervalMs);
	}

	#apply(state: MobileHeartbeatState) {
		this.desktopPresent = state.desktop_present;
		this.mobilePresent = state.mobile_present;
		this.connected = state.connected;
	}

	#finishEnded() {
		const storage = this.#storage;
		const onEnded = this.#onEnded;
		this.ended = true;
		this.desktopPresent = null;
		this.mobilePresent = null;
		this.connected = null;
		this.stop();
		if (storage) clearStoredCaptureCredential(storage);
		onEnded?.();
	}

	#clearTimer() {
		if (!this.#timer) return;
		clearInterval(this.#timer);
		this.#timer = null;
	}
}
