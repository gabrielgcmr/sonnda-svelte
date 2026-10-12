// src/lib/features/labextraction/labExtraction.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { extractStandaloneLabReport, extractLabReportFromCapture, validateLabDocument } = vi.hoisted(
	() => ({
		extractStandaloneLabReport: vi.fn(),
		extractLabReportFromCapture: vi.fn(),
		validateLabDocument: vi.fn()
	})
);

vi.mock('./labExtractionApi.js', () => ({
	extractStandaloneLabReport,
	extractLabReportFromCapture
}));
vi.mock('./fileValidation.js', () => ({ validateLabDocument }));

import { LabExtractionState } from './labExtraction.svelte.js';
import type { LabExtractionResult } from './types.js';

const result = (status = 'succeeded'): LabExtractionResult => ({
	status,
	summary_text: 'Glicose: 90 mg/dL',
	warnings: status === 'partial' ? [{ code: 'review', message: 'Confira o valor.' }] : null,
	report: {
		patient_name: 'Ana',
		patient_dob: '1990-04-12',
		lab_name: 'Laboratório Sonnda',
		lab_phone: null,
		insurance_provider: null,
		requesting_doctor: null,
		technical_manager: null,
		report_date: '2026-10-09',
		tests: [
			{
				test_name: 'Glicose',
				material: 'Soro',
				method: null,
				collected_at: null,
				release_at: null,
				items: [
					{
						parameter_name: 'Glicose',
						result_value: '90',
						result_unit: 'mg/dL',
						reference_text: '70 a 99 mg/dL'
					}
				]
			}
		]
	}
});

const pdf = (name = 'exam.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

const capture = { id: 'capture-1', original_filename: 'exame-celular.pdf' };

beforeEach(() => {
	extractStandaloneLabReport.mockReset();
	extractLabReportFromCapture.mockReset();
	validateLabDocument.mockReset();
	validateLabDocument.mockResolvedValue({ valid: true });
});

describe('LabExtractionState', () => {
	it('validates a selected file before retaining it', async () => {
		const state = new LabExtractionState();
		const file = pdf();
		validateLabDocument.mockResolvedValueOnce({ valid: false, error: 'Documento inválido.' });

		expect(await state.selectFile(file)).toBe(false);
		expect(validateLabDocument).toHaveBeenCalledWith(file);
		expect(state.file).toBeNull();
		expect(state.fileError).toBe('Documento inválido.');
	});

	it('extracts a valid file and keeps partial results and warnings', async () => {
		const state = new LabExtractionState();
		const file = pdf();
		await state.selectFile(file);
		extractStandaloneLabReport.mockResolvedValue({ data: result('partial') });

		expect(await state.extract('token', 'account-a')).toBe(true);

		expect(extractStandaloneLabReport).toHaveBeenCalledWith('token', file);
		expect(state.status).toBe('ready');
		expect(state.result?.status).toBe('partial');
		expect(state.result?.warnings).toHaveLength(1);
	});

	it('preserves public API problems and the selected file for retry', async () => {
		const state = new LabExtractionState();
		const file = pdf();
		await state.selectFile(file);
		extractStandaloneLabReport.mockResolvedValue({
			error: { type: 'about:blank', title: 'Arquivo inválido', status: 422 }
		});

		expect(await state.extract('token', 'account-a')).toBe(false);
		expect(state.status).toBe('error');
		expect(state.problem?.status).toBe(422);
		expect(state.file).toBe(file);
	});

	it('ignores a delayed result after the account changes', async () => {
		const state = new LabExtractionState();
		await state.selectFile(pdf());
		let resolveExtraction!: (value: unknown) => void;
		extractStandaloneLabReport.mockReturnValue(
			new Promise((resolve) => (resolveExtraction = resolve))
		);

		const extraction = state.extract('old-token', 'account-a');
		state.bindAccount('account-b');
		resolveExtraction({ data: result() });

		expect(await extraction).toBe(false);
		expect(state.accountId).toBe('account-b');
		expect(state.file).toBeNull();
		expect(state.result).toBeNull();
		expect(state.status).toBe('idle');
	});

	it('clears the file and result when starting another extraction', async () => {
		const state = new LabExtractionState();
		await state.selectFile(pdf());
		extractStandaloneLabReport.mockResolvedValue({ data: result() });
		await state.extract('token', 'account-a');

		state.startOver();

		expect(state.file).toBeNull();
		expect(state.result).toBeNull();
		expect(state.problem).toBeNull();
		expect(state.status).toBe('idle');
	});

	it('extracts a capture by id without sending a file', async () => {
		const state = new LabExtractionState();
		await state.selectFile(pdf());
		extractLabReportFromCapture.mockResolvedValue({ data: result() });

		state.selectCapture(capture);
		expect(state.file).toBeNull();
		expect(await state.extract('token', 'account-a')).toBe(true);

		expect(extractLabReportFromCapture).toHaveBeenCalledWith('token', 'capture-1');
		expect(extractStandaloneLabReport).not.toHaveBeenCalled();
		expect(state.status).toBe('ready');
	});

	it('keeps the capture selected for retry after an API problem', async () => {
		const state = new LabExtractionState();
		state.selectCapture(capture);
		extractLabReportFromCapture.mockResolvedValue({
			error: { type: 'about:blank', title: 'Captura não encontrada', status: 404 }
		});

		expect(await state.extract('token', 'account-a')).toBe(false);
		expect(state.problem?.status).toBe(404);
		expect(state.capture).toEqual(capture);
	});

	it('ignores a delayed capture result after another source is selected', async () => {
		const state = new LabExtractionState();
		state.selectCapture(capture);
		let resolveExtraction!: (value: unknown) => void;
		extractLabReportFromCapture.mockReturnValue(
			new Promise((resolve) => (resolveExtraction = resolve))
		);

		const extraction = state.extract('token', 'account-a');
		const file = pdf('local.pdf');
		await state.selectFile(file);
		resolveExtraction({ data: result() });

		expect(await extraction).toBe(false);
		expect(state.capture).toBeNull();
		expect(state.file).toBe(file);
		expect(state.result).toBeNull();
		expect(state.status).toBe('idle');
	});

	it('reports a missing file before calling the API', async () => {
		const state = new LabExtractionState();

		expect(await state.extract('token', 'account-a')).toBe(false);
		expect(state.fileError).toBe('Selecione um arquivo PDF, JPEG ou PNG para continuar.');
		expect(extractStandaloneLabReport).not.toHaveBeenCalled();
	});
});
