// src/lib/features/capture/captureFile.ts

export const maxCaptureFileBytes = 5 * 1024 * 1024;

export type CaptureFileIssue = 'empty' | 'too-large' | 'unsupported';

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function matches(bytes: Uint8Array, signature: number[]) {
	return (
		bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value)
	);
}

export function captureSupportsStandaloneExtraction(mimeType: string) {
	return mimeType === 'application/pdf' || mimeType === 'image/jpeg' || mimeType === 'image/png';
}

export async function readCaptureFileIssue(file: File): Promise<CaptureFileIssue | null> {
	if (file.size === 0) return 'empty';
	if (file.size > maxCaptureFileBytes) return 'too-large';

	const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
	const isPdf = signature.length >= 5 && String.fromCharCode(...signature.slice(0, 5)) === '%PDF-';
	const isJpeg = matches(signature, [0xff, 0xd8, 0xff]);
	const isPng = matches(signature, pngSignature);
	return isPdf || isJpeg || isPng ? null : 'unsupported';
}

export function captureFileIssueMessage(issue: CaptureFileIssue) {
	switch (issue) {
		case 'empty':
			return 'O arquivo está vazio.';
		case 'too-large':
			return 'O arquivo deve ter no máximo 5 MiB.';
		case 'unsupported':
			return 'Envie um PDF, JPEG ou PNG.';
	}
}
