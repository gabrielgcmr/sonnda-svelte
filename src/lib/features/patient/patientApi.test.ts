// src/lib/features/patient/patientApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('#lib/api/client.js', () => ({ apiClient: { GET: get } }));

import { getPatient, listAccessiblePatients } from './patientApi.js';

beforeEach(() => get.mockReset());

describe('patientApi', () => {
	it('lists accessible patients with pagination and the Supabase access token', async () => {
		get.mockResolvedValue({ data: {} });

		await listAccessiblePatients('access-token', 100, 200);

		expect(get).toHaveBeenCalledWith('/me/patients', {
			headers: { Authorization: 'Bearer access-token' },
			params: { query: { limit: 100, offset: 200 } }
		});
	});

	it('gets a patient profile by path id with the access token', async () => {
		get.mockResolvedValue({ data: {} });

		await getPatient('access-token', 'patient-id');

		expect(get).toHaveBeenCalledWith('/patients/{patientId}', {
			headers: { Authorization: 'Bearer access-token' },
			params: { path: { patientId: 'patient-id' } }
		});
	});
});
