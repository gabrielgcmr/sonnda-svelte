// src/lib/features/account/accountApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({
	get: vi.fn()
}));

vi.mock('#lib/api/client.js', () => ({
	apiClient: { GET: get }
}));

import { getCurrentAccount } from './accountApi';

beforeEach(() => {
	get.mockReset();
});

describe('accountApi', () => {
	it('gets the current account with the Supabase access token', async () => {
		get.mockResolvedValue({ data: {} });
		await getCurrentAccount('access-token');

		expect(get).toHaveBeenCalledWith('/me', {
			headers: { Authorization: 'Bearer access-token' }
		});
	});
});
