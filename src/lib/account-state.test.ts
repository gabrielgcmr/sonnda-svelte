// src/lib/account-state.test.ts
import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentAccount } = vi.hoisted(() => ({
	getCurrentAccount: vi.fn()
}));

vi.mock('./apiClient', () => ({
	apiClient: {
		GET: getCurrentAccount
	}
}));

import type { Account } from './account.svelte';
import { currentAccount } from './account.svelte';

const session = (accessToken: string) => ({ access_token: accessToken }) as Session;

const account = (id: string): Account => ({
	id,
	email: 'person@example.com',
	account_type: 'basic_care',
	profile: {
		full_name: 'Person',
		birth_date: null,
		cpf: null,
		phone: null
	},
	onboarding_completed: true,
	created_at: '2026-10-07T00:00:00Z',
	updated_at: '2026-10-07T00:00:00Z'
});

beforeEach(() => {
	currentAccount.clear();
	getCurrentAccount.mockReset();
});

describe('currentAccount', () => {
	it('loads the current account with the Supabase access token', async () => {
		const expected = account('0199c265-34b1-7000-8000-000000000001');
		getCurrentAccount.mockResolvedValue({ data: expected });

		await currentAccount.load(session('access-token'));

		expect(getCurrentAccount).toHaveBeenCalledWith('/me', {
			headers: { Authorization: 'Bearer access-token' }
		});
		expect(currentAccount.account).toEqual(expected);
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.loading).toBe(false);
	});

	it('stores the public problem details returned by the API', async () => {
		const problem = { type: 'about:blank', title: 'Forbidden', status: 403 };
		getCurrentAccount.mockResolvedValue({ error: problem });

		await currentAccount.load(session('access-token'));

		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toEqual(problem);
	});

	it('ignores an obsolete response after a newer account request', async () => {
		let resolveFirst!: (value: { data: Account }) => void;
		let resolveSecond!: (value: { data: Account }) => void;
		getCurrentAccount
			.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
			.mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));

		const firstLoad = currentAccount.load(session('first-token'));
		const secondLoad = currentAccount.load(session('second-token'));
		const latest = account('0199c265-34b1-7000-8000-000000000002');

		resolveSecond({ data: latest });
		await secondLoad;
		resolveFirst({ data: account('0199c265-34b1-7000-8000-000000000003') });
		await firstLoad;

		expect(currentAccount.account).toEqual(latest);
	});

	it('clears account data and invalidates an in-flight request', async () => {
		let resolveRequest!: (value: { data: Account }) => void;
		getCurrentAccount.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)));
		const loading = currentAccount.load(session('access-token'));

		currentAccount.clear();
		resolveRequest({ data: account('0199c265-34b1-7000-8000-000000000004') });
		await loading;

		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.loading).toBe(false);
	});
});
