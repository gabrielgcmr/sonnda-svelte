// src/lib/features/capture/capturePdf.test.ts
import { describe, expect, it } from 'vitest';
import { capturePdfIssueMessage, maxCapturePdfBytes, readCapturePdfIssue } from './capturePdf';

const pdf = (name = 'exam.pdf', contents: BlobPart = '%PDF-1.4') =>
	new File([contents], name, { type: 'application/pdf' });

describe('readCapturePdfIssue', () => {
	it('accepts a PDF at the 5 MiB limit', async () => {
		const bytes = new Uint8Array(maxCapturePdfBytes);
		bytes.set(new TextEncoder().encode('%PDF-'));
		expect(await readCapturePdfIssue(pdf('exam.pdf', bytes))).toBeNull();
		expect(maxCapturePdfBytes).toBe(5 * 1024 * 1024);
	});

	it('rejects an empty file, a file above 5 MiB, JPEG, and PNG', async () => {
		expect(await readCapturePdfIssue(pdf('vazio.pdf', new Uint8Array()))).toBe('empty');
		expect(
			await readCapturePdfIssue(pdf('grande.pdf', new Uint8Array(maxCapturePdfBytes + 1)))
		).toBe('too-large');
		expect(
			await readCapturePdfIssue(
				new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'foto.jpg', { type: 'image/jpeg' })
			)
		).toBe('not-pdf');
		expect(
			await readCapturePdfIssue(
				new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d])], 'foto.png', {
					type: 'image/png'
				})
			)
		).toBe('not-pdf');
		expect(capturePdfIssueMessage('too-large')).toBe('O PDF deve ter no máximo 5 MiB.');
		expect(capturePdfIssueMessage('not-pdf')).toBe('O conteúdo do arquivo não é um PDF válido.');
		expect(capturePdfIssueMessage('empty')).toBe('O arquivo está vazio.');
	});
});
