// src/lib/features/labextraction/fileValidation.ts
export const MAX_LAB_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type LabDocumentValidationResult = { valid: true } | { valid: false; error: string };

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function matches(bytes: Uint8Array, signature: number[]) {
	return (
		bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value)
	);
}

export async function validateLabDocument(file: File): Promise<LabDocumentValidationResult> {
	if (file.size === 0) return { valid: false, error: 'O arquivo está vazio.' };
	if (file.size > MAX_LAB_DOCUMENT_BYTES) {
		return { valid: false, error: 'O arquivo deve ter no máximo 10 MB.' };
	}

	const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
	const isPdf = signature.length >= 5 && String.fromCharCode(...signature.slice(0, 5)) === '%PDF-';
	const isJpeg = matches(signature, [0xff, 0xd8, 0xff]);
	const isPng = matches(signature, pngSignature);
	if (!isPdf && !isJpeg && !isPng) {
		return { valid: false, error: 'Envie um arquivo PDF, JPEG ou PNG válido.' };
	}

	return { valid: true };
}
