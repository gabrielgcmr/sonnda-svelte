// src/lib/features/imagingextraction/imagingExtraction.test.ts
import { beforeEach, expect, it, vi } from 'vitest';

const { singleCapture, multipleCaptures, singleFile, multipleFiles } = vi.hoisted(() => ({
	singleCapture: vi.fn(),
	multipleCaptures: vi.fn(),
	singleFile: vi.fn(),
	multipleFiles: vi.fn()
}));

vi.mock('./imagingExtractionApi.js', () => ({
	extractImagingReportFromCapture: singleCapture,
	extractImagingReportFromCaptures: multipleCaptures,
	extractStandaloneImagingReport: singleFile,
	extractImagingReportPages: multipleFiles
}));

import { ImagingExtractionState } from './imagingExtraction.svelte.js';

beforeEach(() => {
	singleCapture.mockReset();
	multipleCaptures.mockReset();
	singleFile.mockReset();
	multipleFiles.mockReset();
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
	let finish!: (value: { data: { status: string } }) => void;
	multipleCaptures.mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		})
	);
	const pending = extraction.extract('token-a', 'account-a');
	expect(multipleCaptures).toHaveBeenCalledWith('token-a', ['page-b', 'page-a']);
	expect(singleCapture).not.toHaveBeenCalled();
	extraction.bindAccount('account-b');
	finish({ data: { status: 'succeeded' } });
	expect(await pending).toBe(false);
	expect(extraction.result).toBeNull();
	expect(extraction.captures).toEqual([]);
});
