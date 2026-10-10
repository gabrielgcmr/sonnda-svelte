// src/lib/features/capture/captureUpload.svelte.ts
import { captureCredentialRejected, uploadCaptureFile } from './captureApi.js';
import { readCapturePdfIssue, type CapturePdfIssue } from './capturePdf.js';

export const captureComputerAwayMessage = 'Abra o Sonnda no computador e tente de novo.';
export const captureUploadRetryMessage = 'Não foi possível enviar o exame. Tente de novo.';
export const captureUploadWaitingMessage = 'Aguarde a conexão com o computador antes de enviar.';

type PresenceProbe = () => Promise<'live' | 'rejected' | 'unavailable'>;

export class CaptureUpload {
	file = $state.raw<File | null>(null);
	issue = $state<CapturePdfIssue | null>(null);
	notice = $state<string | null>(null);
	progress = $state<number | null>(null);
	status = $state<'idle' | 'uploading'>('idle');
	sentNames = $state<string[]>([]);

	#selectVersion = 0;

	async select(file: File | null) {
		this.notice = null;
		this.file = file;
		this.issue = null;
		if (!file) return;

		const version = ++this.#selectVersion;
		const issue = await readCapturePdfIssue(file);
		if (version !== this.#selectVersion) return;
		this.issue = issue;
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
