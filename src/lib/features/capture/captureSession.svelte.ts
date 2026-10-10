// src/lib/features/capture/captureSession.svelte.ts
import { claimCaptureSession, type CaptureProblem } from './captureApi.js';
import {
	readStoredCaptureCredential,
	writeStoredCaptureCredential,
	type CaptureClaimStatus,
	type StoredCaptureCredential
} from './storedCredential.js';

type CredentialStorage = Pick<Storage, 'getItem' | 'setItem'>;

function fallbackProblem(title: string): CaptureProblem {
	return { type: 'about:blank', title };
}

export class CaptureSession {
	status = $state<CaptureClaimStatus>('idle');
	credential = $state.raw<StoredCaptureCredential | null>(null);
	problem = $state.raw<CaptureProblem | null>(null);

	#requestVersion = 0;
	#requestedCode: string | null = null;

	restore(storage: CredentialStorage | null) {
		this.credential = readStoredCaptureCredential(storage);
		this.problem = null;
		this.status = this.credential ? 'ready' : 'idle';
	}

	async claim(code: string, storage: CredentialStorage, removeCodeFromUrl: () => Promise<void>) {
		const normalized = code.trim();
		if (!normalized || normalized === this.#requestedCode) return false;

		const requestVersion = ++this.#requestVersion;
		this.#requestedCode = normalized;
		this.status = 'claiming';
		this.problem = null;

		try {
			const { data, error } = await claimCaptureSession(normalized);
			if (requestVersion !== this.#requestVersion) return false;

			if (!data) {
				this.problem =
					error ?? fallbackProblem('Abra novamente o QR no computador para enviar o exame.');
				this.status = 'error';
				return false;
			}

			const credential = {
				sessionId: data.session_id,
				uploadToken: data.upload_token,
				expiresAt: data.expires_at
			};
			writeStoredCaptureCredential(storage, credential);
			this.credential = credential;
			this.problem = null;
			this.status = 'ready';
			await removeCodeFromUrl();
			return requestVersion === this.#requestVersion;
		} catch {
			if (requestVersion !== this.#requestVersion) return false;
			this.problem = fallbackProblem('Não foi possível conectar à API');
			this.status = 'error';
			return false;
		}
	}
}
