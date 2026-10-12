// src/lib/features/capture/captureFile.test.ts
import { describe, expect, it } from 'vitest';
import {
	captureFileIssueMessage,
	captureSupportsStandaloneExtraction,
	maxCaptureFileBytes,
	readCaptureFileIssue
} from './captureFile';

const file = (contents: BlobPart, name: string, type: string) =>
	new File([contents], name, { type });

describe('readCaptureFileIssue', () => {
	it('accepts a PDF, JPEG, and PNG at the 5 MiB limit', async () => {
		const pdfBytes = new Uint8Array(maxCaptureFileBytes);
		pdfBytes.set(new TextEncoder().encode('%PDF-'));
		const jpegBytes = new Uint8Array(maxCaptureFileBytes);
		jpegBytes.set([0xff, 0xd8, 0xff]);
		const pngBytes = new Uint8Array(maxCaptureFileBytes);
		pngBytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

		expect(await readCaptureFileIssue(file(pdfBytes, 'exame.pdf', 'application/pdf'))).toBeNull();
		expect(await readCaptureFileIssue(file(jpegBytes, 'foto.jpg', 'image/jpeg'))).toBeNull();
		expect(await readCaptureFileIssue(file(pngBytes, 'foto.png', 'image/png'))).toBeNull();
		expect(maxCaptureFileBytes).toBe(5 * 1024 * 1024);
	});

	it('rejects an empty file, a file above 5 MiB, and an unsupported signature', async () => {
		expect(await readCaptureFileIssue(file(new Uint8Array(), 'vazio.pdf', 'application/pdf'))).toBe(
			'empty'
		);
		expect(
			await readCaptureFileIssue(
				file(new Uint8Array(maxCaptureFileBytes + 1), 'grande.jpg', 'image/jpeg')
			)
		).toBe('too-large');
		expect(await readCaptureFileIssue(file('texto', 'nota.txt', 'text/plain'))).toBe('unsupported');
		expect(captureFileIssueMessage('too-large')).toBe('O arquivo deve ter no máximo 5 MiB.');
		expect(captureFileIssueMessage('unsupported')).toBe('Envie um PDF, JPEG ou PNG.');
		expect(captureFileIssueMessage('empty')).toBe('O arquivo está vazio.');
	});

	it('allows standalone extraction for PDF, JPEG, and PNG captures', () => {
		expect(captureSupportsStandaloneExtraction('application/pdf')).toBe(true);
		expect(captureSupportsStandaloneExtraction('image/jpeg')).toBe(true);
		expect(captureSupportsStandaloneExtraction('image/png')).toBe(true);
		expect(captureSupportsStandaloneExtraction('text/plain')).toBe(false);
	});
});
