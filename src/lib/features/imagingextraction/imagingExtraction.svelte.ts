// src/lib/features/imagingextraction/imagingExtraction.svelte.ts
import {
	extractImagingReportFromCapture,
	extractImagingReportFromCaptures,
	extractImagingReportPages,
	extractStandaloneImagingReport
} from './imagingExtractionApi.js';
import { MAX_DOCUMENT_BYTES, validateDocument } from '../documentprocessing/fileValidation.js';
import type {
	ImagingExtractionCapture,
	ImagingExtractionProblem,
	ImagingExtractionStatus,
	ImagingReportResult
} from './types.js';

function fallbackProblem(title: string): ImagingExtractionProblem {
	return { type: 'about:blank', title };
}

export class ImagingExtractionState {
	accountId = $state<string | null>(null);
	file = $state.raw<File | null>(null);
	capture = $state.raw<ImagingExtractionCapture | null>(null);
	files = $state.raw<File[]>([]);
	captures = $state.raw<ImagingExtractionCapture[]>([]);
	fileError = $state<string | null>(null);
	checkingFile = $state(false);
	status = $state<ImagingExtractionStatus>('idle');
	result = $state.raw<ImagingReportResult | null>(null);
	problem = $state.raw<ImagingExtractionProblem | null>(null);

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

	requireFile() {
		if (this.file || this.capture) return true;
		this.fileError = 'Selecione um arquivo PDF, JPEG ou PNG para continuar.';
		return false;
	}

	async selectFiles(files: File[]) {
		this.#resetContent();
		const selectionVersion = this.#selectionVersion;

		if (files.length === 0) return false;
		if (files.length > 5) {
			this.fileError = 'Selecione no máximo 5 imagens do mesmo laudo.';
			return false;
		}
		if (files.reduce((total, file) => total + file.size, 0) > MAX_DOCUMENT_BYTES) {
			this.fileError = 'As imagens devem ter no máximo 10 MB no total.';
			return false;
		}
		this.checkingFile = true;
		try {
			for (const file of files) {
				const validation = await validateDocument(file);
				if (selectionVersion !== this.#selectionVersion) return false;
				if (!validation.valid) {
					this.fileError = validation.error;
					return false;
				}
				if (files.length > 1) {
					const prefix = new Uint8Array(await file.slice(0, 5).arrayBuffer());
					if (selectionVersion !== this.#selectionVersion) return false;
					if (String.fromCharCode(...prefix) === '%PDF-') {
						this.fileError = 'Para várias páginas, selecione apenas imagens JPEG ou PNG.';
						return false;
					}
				}
			}
			this.files = [...files];
			this.file = files[0];
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

	selectCapture(capture: ImagingExtractionCapture) {
		if (this.captures.some((item) => item.id === capture.id)) return;
		const isImage = capture.mime_type === 'image/jpeg' || capture.mime_type === 'image/png';
		const canAppend =
			isImage && this.captures.every((item) => item.mime_type !== 'application/pdf');
		const next = canAppend ? [...this.captures, capture] : [capture];
		if (next.length > 5) {
			this.fileError = 'Selecione no máximo 5 imagens do mesmo laudo.';
			return;
		}
		if (next.reduce((total, item) => total + item.size_bytes, 0) > MAX_DOCUMENT_BYTES) {
			this.fileError = 'As imagens devem ter no máximo 10 MB no total.';
			return;
		}
		this.#resetContent();
		this.captures = next;
		this.capture = next[0];
	}

	removePage(index: number) {
		this.#requestVersion += 1;
		this.result = null;
		this.problem = null;
		this.status = 'idle';
		if (this.files.length) {
			this.files = this.files.filter((_, position) => position !== index);
			this.file = this.files[0] ?? null;
		} else {
			this.captures = this.captures.filter((_, position) => position !== index);
			this.capture = this.captures[0] ?? null;
		}
	}

	movePage(index: number, direction: -1 | 1) {
		const items = this.files.length ? this.files : this.captures;
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const ordered = [...items];
		[ordered[index], ordered[target]] = [ordered[target], ordered[index]];
		this.#requestVersion += 1;
		this.result = null;
		this.problem = null;
		this.status = 'idle';
		if (this.files.length) {
			this.files = ordered as File[];
			this.file = this.files[0];
		} else {
			this.captures = ordered as ImagingExtractionCapture[];
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
		const request =
			selectedFiles.length > 1
				? () => extractImagingReportPages(accessToken, selectedFiles)
				: selectedFile
					? () => extractStandaloneImagingReport(accessToken, selectedFile)
					: selectedCaptures.length > 1
						? () =>
								extractImagingReportFromCaptures(
									accessToken,
									selectedCaptures.map((item) => item.id)
								)
						: selectedCapture
							? () => extractImagingReportFromCapture(accessToken, selectedCapture.id)
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
		this.problem = null;

		try {
			const response = await request();
			if (!isCurrent()) return false;
			if (response.data) {
				this.result = response.data;
				this.status = 'ready';
				return true;
			}
			this.problem =
				response.error ?? fallbackProblem('Não foi possível extrair o laudo de imagem.');
			this.status = 'error';
			return false;
		} catch {
			if (!isCurrent()) return false;
			this.problem = fallbackProblem('Não foi possível conectar à API.');
			this.status = 'error';
			return false;
		}
	}
}
