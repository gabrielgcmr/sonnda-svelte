// src/lib/features/labextraction/fileValidation.test.ts
import { describe, expect, it } from 'vitest';
import { MAX_LAB_PDF_BYTES, validateLabPdf } from './fileValidation.js';

describe('validateLabPdf', () => {
	it('accepts a PDF with the correct signature', async () => {
		const file = new File(['%PDF-1.4 test'], 'exam.pdf', { type: 'application/pdf' });
		expect(await validateLabPdf(file)).toEqual({ valid: true });
	});

	it('rejects an absent payload represented by an empty file', async () => {
		const file = new File([], 'exam.pdf', { type: 'application/pdf' });
		expect(await validateLabPdf(file)).toEqual({
			valid: false,
			error: 'O arquivo está vazio.'
		});
	});

	it('rejects a file larger than 10 MB', async () => {
		const file = new File([new Uint8Array(MAX_LAB_PDF_BYTES + 1)], 'exam.pdf', {
			type: 'application/pdf'
		});
		expect(await validateLabPdf(file)).toEqual({
			valid: false,
			error: 'O PDF deve ter no máximo 10 MB.'
		});
	});

	it('rejects a non-PDF MIME type', async () => {
		const file = new File(['%PDF-1.4'], 'exam.txt', { type: 'text/plain' });
		expect(await validateLabPdf(file)).toEqual({
			valid: false,
			error: 'Selecione um arquivo no formato PDF.'
		});
	});

	it('rejects a renamed file without the PDF signature', async () => {
		const file = new File(['plain text'], 'exam.pdf', { type: 'application/pdf' });
		expect(await validateLabPdf(file)).toEqual({
			valid: false,
			error: 'O conteúdo do arquivo não é um PDF válido.'
		});
	});
});
