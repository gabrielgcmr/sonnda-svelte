import { describe, expect, it } from 'vitest';
import { MAX_LAB_DOCUMENT_BYTES, validateLabDocument } from './fileValidation.js';

describe('validateLabDocument', () => {
	it.each([
		['PDF', new File(['%PDF-1.4 test'], 'exam.pdf', { type: 'application/pdf' })],
		[
			'JPEG',
			new File([new Uint8Array([0xff, 0xd8, 0xff, 0x01])], 'exam.jpg', { type: 'image/jpeg' })
		],
		[
			'PNG',
			new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'exam.png', {
				type: 'image/png'
			})
		]
	])('accepts %s by its content signature', async (_, file) => {
		expect(await validateLabDocument(file)).toEqual({ valid: true });
	});

	it('rejects an empty file and a file larger than 10 MB', async () => {
		expect(
			await validateLabDocument(new File([], 'exam.pdf', { type: 'application/pdf' }))
		).toEqual({
			valid: false,
			error: 'O arquivo está vazio.'
		});
		const large = new File([new Uint8Array(MAX_LAB_DOCUMENT_BYTES + 1)], 'exam.png', {
			type: 'image/png'
		});
		expect(await validateLabDocument(large)).toEqual({
			valid: false,
			error: 'O arquivo deve ter no máximo 10 MB.'
		});
	});

	it('rejects unsupported content even when renamed', async () => {
		const file = new File(['plain text'], 'exam.pdf', { type: 'application/pdf' });
		expect(await validateLabDocument(file)).toEqual({
			valid: false,
			error: 'Envie um arquivo PDF, JPEG ou PNG válido.'
		});
	});
});
