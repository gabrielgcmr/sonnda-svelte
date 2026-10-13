// src/lib/features/documentprocessing/optimizeImage.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { optimizeImage } from './optimizeImage.js';

afterEach(() => vi.unstubAllGlobals());

describe('optimizeImage', () => {
	it('keeps PDFs unchanged', async () => {
		const pdf = new File(['%PDF-1.4'], 'report.pdf', { type: 'application/pdf' });
		expect(await optimizeImage(pdf)).toBe(pdf);
	});

	it('uses oriented dimensions and keeps a smaller JPEG', async () => {
		const close = vi.fn();
		const drawImage = vi.fn();
		const canvas = {
			width: 0,
			height: 0,
			getContext: () => ({ drawImage }),
			toBlob: (resolve: (value: Blob) => void) =>
				resolve(new Blob([new Uint8Array(50)], { type: 'image/jpeg' }))
		};
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn().mockResolvedValue({ width: 4000, height: 2000, close })
		);
		vi.stubGlobal('document', { createElement: () => canvas });
		const jpeg = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });
		const optimized = await optimizeImage(jpeg);
		expect(optimized.type).toBe('image/jpeg');
		expect(optimized.size).toBe(50);
		expect(canvas.width).toBe(2400);
		expect(canvas.height).toBe(1200);
		expect(drawImage).toHaveBeenCalledOnce();
		expect(close).toHaveBeenCalledOnce();
	});
});
