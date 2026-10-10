// src/lib/features/capture/captureUpload.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadCaptureFile } = vi.hoisted(() => ({
	uploadCaptureFile: vi.fn()
}));

vi.mock('./captureApi.js', () => ({
	uploadCaptureFile,
	captureCredentialRejected: (error: { status?: number } | undefined) =>
		error?.status === 401 || error?.status === 404
}));

import { maxCapturePdfBytes } from './capturePdf.js';
import {
	CaptureUpload,
	captureComputerAwayMessage,
	captureUploadRetryMessage
} from './captureUpload.svelte.js';

const pdf = () => new File(['%PDF-1.4'], 'hemograma.pdf', { type: 'application/pdf' });

beforeEach(() => {
	uploadCaptureFile.mockReset();
});

describe('CaptureUpload', () => {
	it('keeps JPEG, PNG, and oversized files on the phone', async () => {
		const upload = new CaptureUpload();

		await upload.select(
			new File([new Uint8Array([0xff, 0xd8, 0xff])], 'foto.jpg', { type: 'image/jpeg' })
		);
		expect(upload.issue).toBe('not-pdf');
		await upload.select(
			new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'foto.png', { type: 'image/png' })
		);
		expect(upload.issue).toBe('not-pdf');
		await upload.select(
			new File([new Uint8Array(maxCapturePdfBytes + 1)], 'grande.pdf', { type: 'application/pdf' })
		);
		expect(upload.issue).toBe('too-large');

		expect(
			await upload.submit({ desktopPresent: true, uploadToken: 'token', probe: vi.fn() })
		).toBe('blocked');
		expect(uploadCaptureFile).not.toHaveBeenCalled();
		expect(upload.file?.name).toBe('grande.pdf');
	});

	it('waits for the first presence result before uploading', async () => {
		const upload = new CaptureUpload();
		await upload.select(pdf());

		expect(
			await upload.submit({ desktopPresent: null, uploadToken: 'token', probe: vi.fn() })
		).toBe('kept');

		expect(uploadCaptureFile).not.toHaveBeenCalled();
		expect(upload.file?.name).toBe('hemograma.pdf');
		expect(upload.notice).toBe('Aguarde a conexão com o computador antes de enviar.');
	});

	it('does not upload while the computer is away and keeps the selected PDF', async () => {
		const upload = new CaptureUpload();
		await upload.select(pdf());

		expect(
			await upload.submit({ desktopPresent: false, uploadToken: 'token', probe: vi.fn() })
		).toBe('kept');

		expect(uploadCaptureFile).not.toHaveBeenCalled();
		expect(upload.file?.name).toBe('hemograma.pdf');
		expect(upload.notice).toBe(captureComputerAwayMessage);
	});

	it('uploads a valid PDF and lists only the returned name', async () => {
		uploadCaptureFile.mockImplementation(
			async (_token: string, _file: File, onProgress?: (percent: number) => void) => {
				onProgress?.(40);
				onProgress?.(100);
				return { data: { original_filename: 'hemograma.pdf' } };
			}
		);
		const upload = new CaptureUpload();
		await upload.select(pdf());

		expect(
			await upload.submit({ desktopPresent: true, uploadToken: 'token', probe: vi.fn() })
		).toBe('sent');

		expect(uploadCaptureFile).toHaveBeenCalledWith('token', expect.any(File), expect.any(Function));
		expect(upload.sentNames).toEqual(['hemograma.pdf']);
		expect(upload.file).toBeNull();
		expect(upload.progress).toBeNull();
	});

	it('keeps the file when a rejected upload is followed by a live heartbeat', async () => {
		uploadCaptureFile.mockResolvedValue({
			error: {
				type: 'about:blank',
				title: 'credencial de captura inválida ou expirada',
				status: 401
			}
		});
		const probe = vi.fn().mockResolvedValue('live');
		const upload = new CaptureUpload();
		await upload.select(pdf());

		expect(await upload.submit({ desktopPresent: true, uploadToken: 'token', probe })).toBe('kept');

		expect(probe).toHaveBeenCalledTimes(1);
		expect(upload.file?.name).toBe('hemograma.pdf');
		expect(upload.notice).toBe(captureComputerAwayMessage);
		expect(upload.sentNames).toEqual([]);
	});

	it('drops the file when the follow-up heartbeat rejects the credential', async () => {
		uploadCaptureFile.mockResolvedValue({
			error: {
				type: 'about:blank',
				title: 'credencial de captura inválida ou expirada',
				status: 401
			}
		});
		const upload = new CaptureUpload();
		await upload.select(pdf());

		expect(
			await upload.submit({
				desktopPresent: true,
				uploadToken: 'token',
				probe: vi.fn().mockResolvedValue('rejected')
			})
		).toBe('ended');

		expect(upload.file).toBeNull();
		expect(upload.notice).toBeNull();
	});

	it('keeps the file after a network failure so it can be sent again', async () => {
		uploadCaptureFile
			.mockResolvedValueOnce({
				error: { type: 'about:blank', title: 'Não foi possível conectar à API' }
			})
			.mockResolvedValueOnce({ data: { original_filename: 'hemograma.pdf' } });
		const upload = new CaptureUpload();
		await upload.select(pdf());

		expect(
			await upload.submit({ desktopPresent: true, uploadToken: 'token', probe: vi.fn() })
		).toBe('kept');
		expect(upload.file?.name).toBe('hemograma.pdf');
		expect(upload.notice).toBe(captureUploadRetryMessage);

		expect(
			await upload.submit({ desktopPresent: true, uploadToken: 'token', probe: vi.fn() })
		).toBe('sent');
		expect(upload.sentNames).toEqual(['hemograma.pdf']);
	});
});
