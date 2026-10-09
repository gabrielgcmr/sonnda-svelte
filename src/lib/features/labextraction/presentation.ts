// src/lib/features/labextraction/presentation.ts
export type ExtractionStatusPresentation = {
	label: string;
	variant: 'success' | 'warning' | 'error' | 'info';
};

export function extractionStatusPresentation(status: string): ExtractionStatusPresentation {
	switch (status) {
		case 'succeeded':
			return { label: 'Concluída', variant: 'success' };
		case 'partial':
			return { label: 'Resultado parcial', variant: 'warning' };
		case 'needs_review':
			return { label: 'Requer conferência', variant: 'warning' };
		case 'failed':
			return { label: 'Sem resultado utilizável', variant: 'error' };
		default:
			return { label: status || 'Status não informado', variant: 'info' };
	}
}

export function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatExtractedDate(value: string | null | undefined) {
	if (!value) return null;
	const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: value.includes('T') ? 'short' : undefined
	}).format(parsed);
}

export type ClipboardWriter = { writeText(value: string): Promise<void> };

export async function copyExtractionSummary(
	summary: string,
	clipboard: ClipboardWriter | null | undefined
) {
	if (!summary.trim() || !clipboard) return false;
	try {
		await clipboard.writeText(summary);
		return true;
	} catch {
		return false;
	}
}
