// src/lib/features/labextraction/labExtraction.svelte.ts
import { extractStandaloneLabReport } from './labExtractionApi.js';
import { validateLabPdf } from './fileValidation.js';
import type { LabExtractionProblem, LabExtractionResult, LabExtractionStatus } from './types.js';

function fallbackProblem(title: string): LabExtractionProblem {
	return { type: 'about:blank', title };
}

export class LabExtractionState {
	accountId = $state<string | null>(null);
	file = $state.raw<File | null>(null);
	fileError = $state<string | null>(null);
	checkingFile = $state(false);
	status = $state<LabExtractionStatus>('idle');
	result = $state.raw<LabExtractionResult | null>(null);
	problem = $state.raw<LabExtractionProblem | null>(null);

	#selectionVersion = 0;
	#requestVersion = 0;

	#resetContent() {
		this.#selectionVersion += 1;
		this.#requestVersion += 1;
		this.file = null;
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
		if (this.file) return true;
		this.fileError = 'Selecione um arquivo PDF para continuar.';
		return false;
	}

	async selectFile(file: File | null) {
		const selectionVersion = ++this.#selectionVersion;
		this.#requestVersion += 1;
		this.file = null;
		this.fileError = null;
		this.status = 'idle';
		this.result = null;
		this.problem = null;

		if (!file) return false;
		this.checkingFile = true;

		try {
			const validation = await validateLabPdf(file);
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

	async extract(accessToken: string, accountId: string) {
		if (this.accountId === null) {
			this.accountId = accountId;
		} else if (this.accountId !== accountId) {
			this.bindAccount(accountId);
			return false;
		}
		if (!this.requireFile()) return false;

		const requestVersion = ++this.#requestVersion;
		const selectedFile = this.file;
		if (!selectedFile) return false;
		this.status = 'processing';
		this.result = null;
		this.problem = null;

		try {
			const { data, error } = await extractStandaloneLabReport(accessToken, selectedFile);
			if (
				requestVersion !== this.#requestVersion ||
				this.accountId !== accountId ||
				this.file !== selectedFile
			) {
				return false;
			}

			if (data) {
				this.result = data;
				this.status = 'ready';
				return true;
			}

			this.problem = error ?? fallbackProblem('Não foi possível extrair os dados do exame');
			this.status = 'error';
			return false;
		} catch {
			if (
				requestVersion !== this.#requestVersion ||
				this.accountId !== accountId ||
				this.file !== selectedFile
			) {
				return false;
			}
			this.problem = fallbackProblem('Não foi possível conectar à API');
			this.status = 'error';
			return false;
		}
	}
}
