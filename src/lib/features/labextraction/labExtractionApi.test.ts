// src/lib/features/labextraction/labExtractionApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('#lib/api/client.js', () => ({ apiClient: { POST: post } }));

import { extractLabReportFromCapture, extractStandaloneLabReport } from './labExtractionApi.js';

beforeEach(() => post.mockReset());

describe('labExtractionApi', () => {
	it('sends an image as multipart with the Supabase access token', async () => {
		const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x01]);
		const file = new File([bytes], 'exam.jpg', { type: 'image/jpeg' });
		post.mockResolvedValue({ data: {} });

		await extractStandaloneLabReport('access-token', file);

		expect(post).toHaveBeenCalledOnce();
		const [path, options] = post.mock.calls[0];
		expect(path).toBe('/lab-extractions');
		expect(options.headers).toEqual({ Authorization: 'Bearer access-token' });
		expect(options.body).toBeInstanceOf(FormData);
		const uploadedFile = options.body.get('file') as File;
		expect(uploadedFile.name).toBe('exam.jpg');
		expect(uploadedFile.type).toBe('image/jpeg');
		expect(new Uint8Array(await uploadedFile.arrayBuffer())).toEqual(bytes);
		expect(options.headers).not.toHaveProperty('Content-Type');
	});

	it('sends only the capture id to extract a captured document', async () => {
		post.mockResolvedValue({ data: {} });

		await extractLabReportFromCapture('access-token', 'capture-1');

		expect(post).toHaveBeenCalledWith('/lab-extractions/from-capture', {
			headers: { Authorization: 'Bearer access-token' },
			body: { capture_id: 'capture-1' }
		});
	});
});
