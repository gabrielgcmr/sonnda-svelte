// src/lib/features/labextraction/labExtraction.svelte.ts
import {
	createTemporaryExtractionFromCaptures,
	createTemporaryExtractionFromFiles
} from '#lib/features/documentprocessing/temporaryExtractionApi.js';
import { validateLabDocument } from './fileValidation.js';
import type {
	LabExtractionCapture,
	LabExtractionProblem,
	LabExtractionResult,
	LabExtractionStatus
} from './types.js';

function fallbackProblem(title: string): LabExtractionProblem {
	return { type: 'about:blank', title };
}

export class LabExtractionState {
	accountId = $state<string | null>(null);
	file = $state.raw<File | null>(null);
	capture = $state.raw<LabExtractionCapture | null>(null);
	fileError = $state<string | null>(null);
	checkingFile = $state(false);
	status = $state<LabExtractionStatus>('idle');
	result = $state.raw<LabExtractionResult | null>(null);
	temporaryId = $state<string | null>(null);
	progress = $state(0);
	problem = $state.raw<LabExtractionProblem | null>(null);

	#selectionVersion = 0;
	#requestVersion = 0;

	#resetContent() {
		this.#selectionVersion += 1;
		this.#requestVersion += 1;
		this.file = null;
		this.capture = null;
		this.fileError = null;
		this.checkingFile = false;
		this.status = 'idle';
		this.result = null;
		this.temporaryId = null;
		this.progress = 0;
		this.problem = null;
	}

	bindAccount(accountId: string | null) {
		if (this.accountId === accountId) return false;
		this.#resetContent();
		this.accountId = accountId;
		return true;
	}

	clear() {
		this.#resetContent();
		this.accountId = null;
	}

	startOver() {
		this.#resetContent();
	}

	restore(result: LabExtractionResult, id: string) {
		this.#resetContent();
		this.result = result;
		this.temporaryId = id;
		this.status = 'ready';
		this.progress = 100;
	}

	restorePending(id: string, progress: number) {
		this.#resetContent();
		this.temporaryId = id;
		this.progress = progress;
		this.status = 'processing';
	}

	restoreFailure(id: string, message: string) {
		this.#resetContent();
		this.temporaryId = id;
		this.problem = fallbackProblem(message);
		this.status = 'error';
	}

	requireFile() {
		if (this.file || this.capture) return true;
		this.fileError = 'Selecione um arquivo PDF, JPEG ou PNG para continuar.';
		return false;
	}

	async selectFile(file: File | null) {
		const selectionVersion = ++this.#selectionVersion;
		this.#requestVersion += 1;
		this.file = null;
		this.capture = null;
		this.fileError = null;
		this.status = 'idle';
		this.result = null;
		this.temporaryId = null;
		this.problem = null;

		if (!file) return false;
		this.checkingFile = true;

		try {
			const validation = await validateLabDocument(file);
			if (selectionVersion !== this.#selectionVersion) return false;
			if (!validation.valid) {
				this.fileError = validation.error;
				return false;
			}
			this.file = file;
			return true;
		} catch {
			if (selectionVersion !== this.#selectionVersion) return false;
			this.fileError = 'Não foi possível ler o arquivo selecionado.';
			return false;
		} finally {
			if (selectionVersion === this.#selectionVersion) this.checkingFile = false;
		}
	}

	/** The API reads the capture on the server; only its id leaves the browser. */
	selectCapture(capture: LabExtractionCapture) {
		this.#resetContent();
		this.capture = { ...capture };
	}

	async extract(accessToken: string, accountId: string) {
		if (this.accountId === null) {
			this.accountId = accountId;
		} else if (this.accountId !== accountId) {
			this.bindAccount(accountId);
			return false;
		}
		if (!this.requireFile()) return false;

		const selectedFile = this.file;
		const selectedCapture = this.capture;
		const request = selectedFile
			? () => createTemporaryExtractionFromFiles(accessToken, 'laboratory', [selectedFile])
			: selectedCapture
				? () =>
						createTemporaryExtractionFromCaptures(accessToken, 'laboratory', [selectedCapture.id])
				: null;
		if (!request) return false;

		const requestVersion = ++this.#requestVersion;
		const isCurrent = () =>
			requestVersion === this.#requestVersion &&
			this.accountId === accountId &&
			this.file === selectedFile &&
			this.capture === selectedCapture;
		this.status = 'processing';
		this.result = null;
		this.temporaryId = null;
		this.progress = 0;
		this.problem = null;

		try {
			const { data, error } = await request();
			if (!isCurrent()) return false;

			if (data?.lab_result) {
				this.result = data.lab_result;
				this.temporaryId = data.id;
				this.status = 'ready';
				this.progress = 100;
				return true;
			}
			if (data && (data.status === 'queued' || data.status === 'processing')) {
				this.temporaryId = data.id;
				this.progress = data.progress;
				return true;
			}

			this.problem = error ?? fallbackProblem('Não foi possível extrair os dados do exame');
			this.status = 'error';
			return false;
		} catch {
			if (!isCurrent()) return false;
			this.problem = fallbackProblem('Não foi possível conectar à API');
			this.status = 'error';
			return false;
		}
	}
}
