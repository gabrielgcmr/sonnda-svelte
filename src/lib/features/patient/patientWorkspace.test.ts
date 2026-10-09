// src/lib/features/patient/patientWorkspace.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPatient, getPatient, listAccessiblePatients } = vi.hoisted(() => ({
	createPatient: vi.fn(),
	getPatient: vi.fn(),
	listAccessiblePatients: vi.fn()
}));

vi.mock('./patientApi.js', () => ({ createPatient, getPatient, listAccessiblePatients }));

import { patientWorkspace } from './patientWorkspace.svelte.js';
import type { AccessiblePatient, Patient } from './types.js';

const accessiblePatient = (id: string, fullName: string): AccessiblePatient => ({
	id,
	full_name: fullName
});

const patient = (id: string, fullName: string): Patient => ({
	id,
	full_name: fullName,
	avatar_url: '',
	birth_date: '1990-04-12T00:00:00Z',
	cpf: '12345678901',
	gender: 'FEMALE',
	race: 'MIXED',
	created_at: '2026-10-08T00:00:00Z',
	updated_at: '2026-10-08T00:00:00Z'
});

beforeEach(() => {
	patientWorkspace.clear();
	createPatient.mockReset();
	getPatient.mockReset();
	listAccessiblePatients.mockReset();
});

describe('patientWorkspace creation', () => {
	const input = {
		full_name: 'Ana Sonnda',
		birth_date: '1990-04-12',
		cpf: '52998224725',
		gender: 'FEMALE',
		race: 'MIXED',
		relation_type: 'family'
	};

	it('returns the new id and invalidates the cached list without losing the search', async () => {
		listAccessiblePatients.mockResolvedValue({
			data: {
				patients: [accessiblePatient('old-patient', 'Pessoa antiga')],
				total: 1,
				limit: 100,
				offset: 0
			}
		});
		await patientWorkspace.ensureList('token', 'account-a');
		patientWorkspace.query = 'ana';
		createPatient.mockResolvedValue({ data: { id: 'new-patient' } });

		const id = await patientWorkspace.create('token', 'account-a', input);

		expect(createPatient).toHaveBeenCalledWith('token', input);
		expect(id).toBe('new-patient');
		expect(patientWorkspace.listStatus).toBe('idle');
		expect(patientWorkspace.patients).toEqual([]);
		expect(patientWorkspace.query).toBe('ana');
		expect(patientWorkspace.createProblem).toBeNull();
	});

	it('preserves the public conflict returned by the API', async () => {
		createPatient.mockResolvedValue({
			error: { type: 'about:blank', title: 'Paciente já cadastrado', status: 409 }
		});

		const id = await patientWorkspace.create('token', 'account-a', input);

		expect(id).toBeNull();
		expect(patientWorkspace.createProblem?.status).toBe(409);
		expect(patientWorkspace.creating).toBe(false);
	});

	it('ignores a delayed creation response after changing accounts', async () => {
		let resolveCreation!: (value: unknown) => void;
		createPatient.mockReturnValue(new Promise((resolve) => (resolveCreation = resolve)));
		const creation = patientWorkspace.create('old-token', 'account-a', input);

		listAccessiblePatients.mockResolvedValue({
			data: { patients: [], total: 0, limit: 100, offset: 0 }
		});
		await patientWorkspace.reloadList('new-token', 'account-b');
		resolveCreation({ data: { id: 'old-account-patient' } });

		expect(await creation).toBeNull();
		expect(patientWorkspace.accountId).toBe('account-b');
		expect(patientWorkspace.listStatus).toBe('ready');
	});
});

describe('patientWorkspace list', () => {
	it('loads every page of 100 and finds later patients ignoring accents and case', async () => {
		const firstPage = Array.from({ length: 100 }, (_, index) =>
			accessiblePatient(`patient-${index}`, `Pessoa ${index}`)
		);
		listAccessiblePatients
			.mockResolvedValueOnce({
				data: { patients: firstPage, total: 101, limit: 100, offset: 0 }
			})
			.mockResolvedValueOnce({
				data: {
					patients: [accessiblePatient('patient-100', 'Érica Álvares')],
					total: 101,
					limit: 100,
					offset: 100
				}
			});

		await patientWorkspace.ensureList('token', 'account-a');
		patientWorkspace.query = 'ERICA alvares';

		expect(listAccessiblePatients).toHaveBeenNthCalledWith(1, 'token', 100, 0);
		expect(listAccessiblePatients).toHaveBeenNthCalledWith(2, 'token', 100, 100);
		expect(patientWorkspace.listComplete).toBe(true);
		expect(patientWorkspace.filteredPatients.map(({ id }) => id)).toEqual(['patient-100']);
	});

	it('keeps the list marked incomplete while a later page is pending', async () => {
		const firstPage = Array.from({ length: 100 }, (_, index) =>
			accessiblePatient(`patient-${index}`, `Pessoa ${index}`)
		);
		let resolveSecond!: (value: unknown) => void;
		listAccessiblePatients
			.mockResolvedValueOnce({
				data: { patients: firstPage, total: 101, limit: 100, offset: 0 }
			})
			.mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));

		const loading = patientWorkspace.ensureList('token', 'account-a');
		await vi.waitFor(() => expect(listAccessiblePatients).toHaveBeenCalledTimes(2));

		expect(patientWorkspace.listStatus).toBe('loading');
		expect(patientWorkspace.listComplete).toBe(false);
		expect(patientWorkspace.patients).toHaveLength(100);

		resolveSecond({
			data: {
				patients: [accessiblePatient('patient-100', 'Última pessoa')],
				total: 101,
				limit: 100,
				offset: 100
			}
		});
		await loading;
	});

	it('does not restore an old account list from a delayed response', async () => {
		let resolveOld!: (value: unknown) => void;
		listAccessiblePatients
			.mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)))
			.mockResolvedValueOnce({
				data: {
					patients: [accessiblePatient('new-patient', 'Conta nova')],
					total: 1,
					limit: 100,
					offset: 0
				}
			});

		const oldLoad = patientWorkspace.ensureList('old-token', 'account-a');
		await patientWorkspace.reloadList('new-token', 'account-b');
		resolveOld({
			data: {
				patients: [accessiblePatient('old-patient', 'Conta antiga')],
				total: 1,
				limit: 100,
				offset: 0
			}
		});
		await oldLoad;

		expect(patientWorkspace.accountId).toBe('account-b');
		expect(patientWorkspace.patients.map(({ id }) => id)).toEqual(['new-patient']);
	});
});

describe('patientWorkspace selection', () => {
	it('loads a patient directly and preserves API access errors', async () => {
		getPatient.mockResolvedValueOnce({ data: patient('patient-a', 'Ana') });
		await patientWorkspace.ensurePatient('token', 'account-a', 'patient-a');

		expect(getPatient).toHaveBeenCalledWith('token', 'patient-a');
		expect(patientWorkspace.selectedPatient?.full_name).toBe('Ana');
		expect(patientWorkspace.patientStatus).toBe('ready');

		getPatient.mockResolvedValueOnce({
			error: { type: 'about:blank', title: 'Forbidden', status: 403 }
		});
		await patientWorkspace.reloadPatient('token', 'account-a', 'patient-b');

		expect(patientWorkspace.selectedPatient).toBeNull();
		expect(patientWorkspace.patientProblem?.status).toBe(403);
		expect(patientWorkspace.patientStatus).toBe('error');
	});

	it('ignores a delayed response after another patient is selected', async () => {
		let resolveFirst!: (value: unknown) => void;
		let resolveSecond!: (value: unknown) => void;
		getPatient
			.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
			.mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));

		const firstLoad = patientWorkspace.ensurePatient('token', 'account-a', 'patient-a');
		const secondLoad = patientWorkspace.reloadPatient('token', 'account-a', 'patient-b');
		resolveSecond({ data: patient('patient-b', 'Beatriz') });
		await secondLoad;
		resolveFirst({ data: patient('patient-a', 'Ana') });
		await firstLoad;

		expect(patientWorkspace.selectedPatientId).toBe('patient-b');
		expect(patientWorkspace.selectedPatient?.full_name).toBe('Beatriz');
	});

	it('clears patient data and search when the session ends', async () => {
		getPatient.mockResolvedValue({ data: patient('patient-a', 'Ana') });
		await patientWorkspace.ensurePatient('token', 'account-a', 'patient-a');
		patientWorkspace.query = 'ana';

		patientWorkspace.clear();

		expect(patientWorkspace.accountId).toBeNull();
		expect(patientWorkspace.query).toBe('');
		expect(patientWorkspace.selectedPatient).toBeNull();
		expect(patientWorkspace.patientStatus).toBe('idle');
	});
});
