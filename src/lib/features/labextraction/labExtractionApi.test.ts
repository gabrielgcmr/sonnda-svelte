// src/lib/features/labextraction/labExtractionApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('#lib/api/client.js', () => ({ apiClient: { POST: post } }));

import { extractStandaloneLabReport } from './labExtractionApi.js';

beforeEach(() => post.mockReset());

describe('labExtractionApi', () => {
	it('sends the PDF as multipart with the Supabase access token', async () => {
		const file = new File(['%PDF-1.4'], 'exam.pdf', { type: 'application/pdf' });
		post.mockResolvedValue({ data: {} });

		await extractStandaloneLabReport('access-token', file);

		expect(post).toHaveBeenCalledOnce();
		const [path, options] = post.mock.calls[0];
		expect(path).toBe('/lab-extractions');
		expect(options.headers).toEqual({ Authorization: 'Bearer access-token' });
		expect(options.body).toBeInstanceOf(FormData);
		const uploadedFile = options.body.get('file') as File;
		expect(uploadedFile.name).toBe('exam.pdf');
		expect(uploadedFile.type).toBe('application/pdf');
		expect(await uploadedFile.text()).toBe('%PDF-1.4');
		expect(options.headers).not.toHaveProperty('Content-Type');
	});
});
