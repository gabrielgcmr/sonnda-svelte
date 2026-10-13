// src/lib/features/labextraction/labExtraction.svelte.ts
import {
	createTemporaryExtractionFromCaptures,
	createTemporaryExtractionFromFiles
} from '#lib/features/documentprocessing/temporaryExtractionApi.js';
import { validateLabDocument } from './fileValidation.js';
import { optimizeImage } from '#lib/features/documentprocessing/optimizeImage.js';
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
	files = $state.raw<File[]>([]);
	captures = $state.raw<LabExtractionCapture[]>([]);
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
		this.files = [];
		this.captures = [];
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

	async selectFiles(incoming: File[], append = false) {
		const selectionVersion = ++this.#selectionVersion;
		this.#requestVersion += 1;
		const files = append && this.files.length ? [...this.files, ...incoming] : incoming;
		this.fileError = null;
		this.status = 'idle';
		this.result = null;
		this.temporaryId = null;
		this.problem = null;

		if (files.length === 0) {
			this.files = [];
			this.file = null;
			return false;
		}
		if (files.length > 20) {
			this.fileError = 'Selecione no máximo 20 imagens do mesmo exame.';
			return false;
		}
		this.checkingFile = true;

		try {
			const prepared: File[] = [];
			for (const file of files) {
				const optimized = await optimizeImage(file);
				if (selectionVersion !== this.#selectionVersion) return false;
				const validation = await validateLabDocument(optimized);
				if (selectionVersion !== this.#selectionVersion) return false;
				if (!validation.valid) {
					this.fileError = validation.error;
					return false;
				}
				if (files.length > 1) {
					const prefix = new Uint8Array(await optimized.slice(0, 5).arrayBuffer());
					if (selectionVersion !== this.#selectionVersion) return false;
					if (String.fromCharCode(...prefix) === '%PDF-') {
						this.fileError = 'Para várias páginas, selecione apenas imagens JPEG ou PNG.';
						return false;
					}
				}
				prepared.push(optimized);
			}
			this.files = prepared;
			this.file = prepared[0];
			this.captures = [];
			this.capture = null;
			return true;
		} catch {
			if (selectionVersion !== this.#selectionVersion) return false;
			this.fileError = 'Não foi possível ler o arquivo selecionado.';
			return false;
		} finally {
			if (selectionVersion === this.#selectionVersion) this.checkingFile = false;
		}
	}

	selectFile(file: File | null) {
		return this.selectFiles(file ? [file] : []);
	}

	/** The API reads the capture on the server; only its id leaves the browser. */
	selectCapture(capture: LabExtractionCapture) {
		if (this.captures.some((item) => item.id === capture.id)) return;
		const image = capture.mime_type === 'image/jpeg' || capture.mime_type === 'image/png';
		const next =
			image && this.captures.every((item) => item.mime_type !== 'application/pdf')
				? [...this.captures, { ...capture }]
				: [{ ...capture }];
		if (next.length > 20) {
			this.fileError = 'Selecione no máximo 20 imagens do mesmo exame.';
			return;
		}
		this.#resetContent();
		this.captures = next;
		this.capture = next[0];
	}

	removePage(index: number) {
		this.#requestVersion += 1;
		this.status = 'idle';
		this.result = null;
		this.temporaryId = null;
		this.problem = null;
		if (this.files.length) {
			this.files = this.files.filter((_, i) => i !== index);
			this.file = this.files[0] ?? null;
		} else {
			this.captures = this.captures.filter((_, i) => i !== index);
			this.capture = this.captures[0] ?? null;
		}
	}

	movePage(index: number, direction: -1 | 1) {
		const target = index + direction;
		const items = this.files.length ? this.files : this.captures;
		if (target < 0 || target >= items.length) return;
		const ordered = [...items];
		[ordered[index], ordered[target]] = [ordered[target], ordered[index]];
		this.#requestVersion += 1;
		this.status = 'idle';
		this.result = null;
		this.temporaryId = null;
		this.problem = null;
		if (this.files.length) {
			this.files = ordered as File[];
			this.file = this.files[0];
		} else {
			this.captures = ordered as LabExtractionCapture[];
			this.capture = this.captures[0];
		}
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
		const selectedFiles = this.files;
		const selectedCaptures = this.captures;
		const request = selectedFile
			? () => createTemporaryExtractionFromFiles(accessToken, 'laboratory', selectedFiles)
			: selectedCapture
				? () =>
						createTemporaryExtractionFromCaptures(
							accessToken,
							'laboratory',
							selectedCaptures.map((item) => item.id)
						)
				: null;
		if (!request) return false;

		const requestVersion = ++this.#requestVersion;
		const isCurrent = () =>
			requestVersion === this.#requestVersion &&
			this.accountId === accountId &&
			this.file === selectedFile &&
			this.capture === selectedCapture &&
			this.files === selectedFiles &&
			this.captures === selectedCaptures;
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
