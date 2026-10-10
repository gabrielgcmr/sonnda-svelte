// src/lib/features/capture/capturePdf.ts

export const maxCapturePdfBytes = 5 * 1024 * 1024;

export type CapturePdfIssue = 'empty' | 'too-large' | 'not-pdf';

export async function readCapturePdfIssue(file: File): Promise<CapturePdfIssue | null> {
	if (file.size === 0) return 'empty';
	if (file.size > maxCapturePdfBytes) return 'too-large';

	const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
	const isPdf = signature.length === 5 && String.fromCharCode(...signature) === '%PDF-';
	return isPdf ? null : 'not-pdf';
}

export function capturePdfIssueMessage(issue: CapturePdfIssue) {
	switch (issue) {
		case 'empty':
			return 'O arquivo está vazio.';
		case 'too-large':
			return 'O PDF deve ter no máximo 5 MiB.';
		case 'not-pdf':
			return 'O conteúdo do arquivo não é um PDF válido.';
	}
}
