// src/lib/features/capture/captureUpload.svelte.ts
import { captureCredentialRejected, uploadCaptureFile } from './captureApi.js';
import { readCaptureFileIssue, type CaptureFileIssue } from './captureFile.js';
import { optimizeImage } from '#lib/features/documentprocessing/optimizeImage.js';

export const captureComputerAwayMessage = 'Abra o Sonnda no computador e tente de novo.';
export const captureUploadRetryMessage = 'Não foi possível enviar o exame. Tente de novo.';
export const captureUploadWaitingMessage = 'Aguarde a conexão com o computador antes de enviar.';

type PresenceProbe = () => Promise<'live' | 'rejected' | 'unavailable'>;

export class CaptureUpload {
	file = $state.raw<File | null>(null);
	issue = $state<CaptureFileIssue | null>(null);
	notice = $state<string | null>(null);
	progress = $state<number | null>(null);
	preparing = $state(false);
	status = $state<'idle' | 'uploading'>('idle');
	sentNames = $state<string[]>([]);

	#selectVersion = 0;

	async select(file: File | null) {
		const version = ++this.#selectVersion;
		this.notice = null;
		this.file = null;
		this.issue = null;
		if (!file) {
			this.preparing = false;
			return;
		}

		this.preparing = true;
		try {
			const prepared = await optimizeImage(file);
			if (version !== this.#selectVersion) return;
			const issue = await readCaptureFileIssue(prepared);
			if (version !== this.#selectVersion) return;
			this.file = prepared;
			this.issue = issue;
		} finally {
			if (version === this.#selectVersion) this.preparing = false;
		}
	}

	async submit(input: {
		desktopPresent: boolean | null;
		uploadToken: string;
		probe: PresenceProbe;
	}) {
		if (!this.file || this.issue || this.status === 'uploading') return 'blocked' as const;
		if (input.desktopPresent !== true) {
			this.notice =
				input.desktopPresent === false ? captureComputerAwayMessage : captureUploadWaitingMessage;
			return 'kept' as const;
		}

		const file = this.file;
		this.status = 'uploading';
		this.progress = 0;
		this.notice = null;
		const result = await uploadCaptureFile(input.uploadToken, file, (percent) => {
			if (this.file !== file || this.status !== 'uploading') return;
			this.progress = percent;
		});
		if (this.file !== file) return 'blocked' as const;

		this.progress = null;
		this.status = 'idle';
		if (result.data) {
			this.sentNames = [...this.sentNames, result.data.original_filename];
			this.file = null;
			this.issue = null;
			return 'sent' as const;
		}

		if (captureCredentialRejected(result.error)) {
			const followUp = await input.probe();
			if (this.file !== file) return 'blocked' as const;
			if (followUp === 'rejected') {
				this.file = null;
				this.issue = null;
				this.notice = null;
				return 'ended' as const;
			}
			this.notice = followUp === 'live' ? captureComputerAwayMessage : captureUploadRetryMessage;
			return 'kept' as const;
		}

		this.notice = captureUploadRetryMessage;
		return 'kept' as const;
	}
}
