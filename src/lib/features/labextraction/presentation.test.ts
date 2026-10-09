// src/lib/features/labextraction/presentation.test.ts
import { describe, expect, it, vi } from 'vitest';
import {
	copyExtractionSummary,
	extractionStatusPresentation,
	formatExtractedDate,
	formatFileSize
} from './presentation.js';

describe('lab extraction presentation', () => {
	it.each([
		['succeeded', 'Concluída', 'success'],
		['partial', 'Resultado parcial', 'warning'],
		['needs_review', 'Requer conferência', 'warning'],
		['failed', 'Sem resultado utilizável', 'error']
	])('presents the status %s', (status, label, variant) => {
		expect(extractionStatusPresentation(status)).toEqual({ label, variant });
	});

	it('formats file sizes and extracted dates', () => {
		expect(formatFileSize(512)).toBe('512 B');
		expect(formatFileSize(1536)).toBe('1.5 KB');
		expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
		expect(formatExtractedDate('2026-10-09')).toBe('09/10/2026');
		expect(formatExtractedDate('not-a-date')).toBe('not-a-date');
	});

	it('copies a non-empty summary and reports clipboard failures', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		expect(await copyExtractionSummary('Glicose: 90 mg/dL', { writeText })).toBe(true);
		expect(writeText).toHaveBeenCalledWith('Glicose: 90 mg/dL');

		writeText.mockRejectedValueOnce(new Error('denied'));
		expect(await copyExtractionSummary('Glicose: 90 mg/dL', { writeText })).toBe(false);
		expect(await copyExtractionSummary('  ', { writeText })).toBe(false);
		expect(await copyExtractionSummary('Resumo', null)).toBe(false);
	});
});
