// src/lib/features/account/accountApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, patch, post } = vi.hoisted(() => ({
	get: vi.fn(),
	patch: vi.fn(),
	post: vi.fn()
}));

vi.mock('#lib/api/client.js', () => ({
	apiClient: { GET: get, PATCH: patch, POST: post }
}));

import {
	activateCurrentAccountAsProfessional,
	getCurrentAccount,
	updateCurrentAccount
} from './accountApi';

beforeEach(() => {
	get.mockReset();
	patch.mockReset();
	post.mockReset();
});

describe('accountApi', () => {
	it('gets the current account with the Supabase access token', async () => {
		get.mockResolvedValue({ data: {} });
		await getCurrentAccount('access-token');

		expect(get).toHaveBeenCalledWith('/me', {
			headers: { Authorization: 'Bearer access-token' }
		});
	});

	it('updates the current account with a typed payload and the access token', async () => {
		const input = { full_name: 'Ana Sonnda', birth_date: '1990-04-12' };
		patch.mockResolvedValue({ data: {} });

		await updateCurrentAccount('access-token', input);

		expect(patch).toHaveBeenCalledWith('/me', {
			headers: { Authorization: 'Bearer access-token' },
			body: input
		});
	});

	it('activates the current account as professional with the access token', async () => {
		post.mockResolvedValue({ data: {} });

		await activateCurrentAccountAsProfessional('access-token', { password: 'activation-secret' });

		expect(post).toHaveBeenCalledWith('/me/professional-activation', {
			headers: { Authorization: 'Bearer access-token' },
			body: { password: 'activation-secret' }
		});
	});
});
