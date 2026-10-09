// src/lib/features/patient/patientApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('#lib/api/client.js', () => ({ apiClient: { GET: get, POST: post } }));

import { createPatient, getPatient, listAccessiblePatients } from './patientApi.js';

beforeEach(() => {
	get.mockReset();
	post.mockReset();
});

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

	it('creates a patient with a typed payload and the access token', async () => {
		const input = {
			full_name: 'Ana Sonnda',
			birth_date: '1990-04-12',
			cpf: '52998224725',
			gender: 'FEMALE',
			race: 'MIXED',
			relation_type: 'family'
		};
		post.mockResolvedValue({ data: { id: 'patient-id' } });

		await createPatient('access-token', input);

		expect(post).toHaveBeenCalledWith('/patients', {
			headers: { Authorization: 'Bearer access-token' },
			body: input
		});
	});
});
