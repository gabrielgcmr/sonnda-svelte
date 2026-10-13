// src/lib/features/documentprocessing/optimizeImage.ts
const MAX_LONG_SIDE = 2400;
const JPEG_QUALITY = 0.85;

/** Browser decoding applies EXIF orientation before the canvas is encoded. */
export async function optimizeImage(file: File): Promise<File> {
	if (file.type !== 'image/jpeg' && file.type !== 'image/png') return file;
	if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch {
		return file;
	}
	try {
		const longest = Math.max(bitmap.width, bitmap.height);
		if (!longest) return file;
		const scale = Math.min(1, MAX_LONG_SIDE / longest);
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		const context = canvas.getContext('2d', { willReadFrequently: file.type === 'image/png' });
		if (!context) return file;
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		if (file.type === 'image/png') {
			const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
			for (let index = 3; index < pixels.length; index += 4) {
				if (pixels[index] !== 255) return file;
			}
		}
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
		);
		// Re-encoding can soften small print. Require a meaningful reduction before replacing it.
		if (!blob || blob.size >= file.size * 0.9) return file;
		return new File([blob], file.name.replace(/\.(png|jpe?g)$/i, '') + '.jpg', {
			type: 'image/jpeg',
			lastModified: file.lastModified
		});
	} catch {
		return file;
	} finally {
		bitmap.close();
	}
}
