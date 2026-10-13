// src/lib/features/imagingextraction/imagingExtraction.test.ts
import { beforeEach, expect, it, vi } from 'vitest';

const { capturesRequest, filesRequest } = vi.hoisted(() => ({
	capturesRequest: vi.fn(),
	filesRequest: vi.fn()
}));

vi.mock('../documentprocessing/temporaryExtractionApi.js', () => ({
	createTemporaryExtractionFromCaptures: capturesRequest,
	createTemporaryExtractionFromFiles: filesRequest
}));

import { ImagingExtractionState } from './imagingExtraction.svelte.js';

beforeEach(() => {
	capturesRequest.mockReset();
	filesRequest.mockReset();
});

it('sends ordered captures as one report and clears in-flight results on account change', async () => {
	const extraction = new ImagingExtractionState();
	extraction.bindAccount('account-a');
	extraction.selectCapture({
		id: 'page-a',
		original_filename: 'a.jpg',
		mime_type: 'image/jpeg',
		size_bytes: 100
	});
	extraction.selectCapture({
		id: 'page-b',
		original_filename: 'b.png',
		mime_type: 'image/png',
		size_bytes: 100
	});
	extraction.movePage(1, -1);
	let finish!: (value: unknown) => void;
	capturesRequest.mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		})
	);
	const pending = extraction.extract('token-a', 'account-a');
	expect(capturesRequest).toHaveBeenCalledWith('token-a', 'imaging', ['page-b', 'page-a']);
	expect(filesRequest).not.toHaveBeenCalled();
	extraction.bindAccount('account-b');
	finish({ data: { id: 'saved-1', imaging_result: { status: 'succeeded' } } });
	expect(await pending).toBe(false);
	expect(extraction.result).toBeNull();
	expect(extraction.captures).toEqual([]);
});
