// src/lib/features/imagingextraction/presentation.ts
import type { ImagingReportResult } from './types.js';

export function imagingExtractionStatusPresentation(status: string) {
	if (status === 'succeeded') return { label: 'Concluída', variant: 'success' as const };
	if (status === 'needs_review')
		return { label: 'Requer conferência', variant: 'warning' as const };
	return { label: status || 'Status não informado', variant: 'info' as const };
}

export function imagingModalityLabel(modality: ImagingReportResult['report']['modality']) {
	switch (modality) {
		case 'ultrasound':
			return 'Ultrassonografia';
		case 'ct':
			return 'Tomografia computadorizada';
		case 'mri':
			return 'Ressonância magnética';
		case 'mammography':
			return 'Mamografia';
		case 'xray':
			return 'Radiografia';
		case 'other':
			return 'Outra modalidade';
		default:
			return 'Modalidade não identificada';
	}
}

export async function copyImagingSummary(
	summary: string,
	clipboard: { writeText(value: string): Promise<void> } | null | undefined
) {
	if (!summary.trim() || !clipboard) return false;
	try {
		await clipboard.writeText(summary);
		return true;
	} catch {
		return false;
	}
}
