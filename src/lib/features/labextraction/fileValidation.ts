// src/lib/features/labextraction/fileValidation.ts
export const MAX_LAB_PDF_BYTES = 10 * 1024 * 1024;

export type LabPdfValidationResult = { valid: true } | { valid: false; error: string };

export async function validateLabPdf(file: File): Promise<LabPdfValidationResult> {
	if (file.size === 0) return { valid: false, error: 'O arquivo está vazio.' };
	if (file.size > MAX_LAB_PDF_BYTES) {
		return { valid: false, error: 'O PDF deve ter no máximo 10 MB.' };
	}

	const pdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';
	if (file.type && !pdfMime) {
		return { valid: false, error: 'Selecione um arquivo no formato PDF.' };
	}
	if (!file.type && !file.name.toLocaleLowerCase('pt-BR').endsWith('.pdf')) {
		return { valid: false, error: 'Selecione um arquivo no formato PDF.' };
	}

	const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
	const isPdf = signature.length === 5 && String.fromCharCode(...signature) === '%PDF-';
	if (!isPdf) return { valid: false, error: 'O conteúdo do arquivo não é um PDF válido.' };

	return { valid: true };
}
