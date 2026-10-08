// src/lib/features/account/account-state.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentAccount, updateCurrentAccount } = vi.hoisted(() => ({
	getCurrentAccount: vi.fn(),
	updateCurrentAccount: vi.fn()
}));

vi.mock('./accountApi', () => ({
	getCurrentAccount,
	updateCurrentAccount
}));

import { currentAccount } from './account.svelte';
import type { Account } from './types';

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
	updateCurrentAccount.mockReset();
});

describe('currentAccount', () => {
	it('starts idle with no account data or pending operation', () => {
		expect(currentAccount.status).toBe('idle');
		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.saving).toBe(false);
	});

	it('loads the current account with the Supabase access token', async () => {
		const expected = account('0199c265-34b1-7000-8000-000000000001');
		let resolveLoad!: (value: { data: Account }) => void;
		getCurrentAccount.mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)));

		const load = currentAccount.load('access-token');

		expect(currentAccount.status).toBe('loading');
		expect(currentAccount.account).toBeNull();

		resolveLoad({ data: expected });
		await load;

		expect(getCurrentAccount).toHaveBeenCalledWith('access-token');
		expect(currentAccount.account).toEqual(expected);
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.status).toBe('ready');
	});

	it('stores the public problem details returned by the API', async () => {
		const problem = { type: 'about:blank', title: 'Forbidden', status: 403 };
		getCurrentAccount.mockResolvedValue({ error: problem });

		await currentAccount.load('access-token');

		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toEqual(problem);
		expect(currentAccount.status).toBe('error');
	});

	it('normalizes network failures without exposing the exception', async () => {
		getCurrentAccount.mockRejectedValue(new Error('fetch failed for internal-host:8080'));

		await currentAccount.load('access-token');

		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toEqual({
			type: 'about:blank',
			title: 'Não foi possível conectar à API'
		});
		expect(currentAccount.status).toBe('error');
	});

	it('ignores an obsolete response after a newer account request', async () => {
		let resolveFirst!: (value: { data: Account }) => void;
		let resolveSecond!: (value: { data: Account }) => void;
		getCurrentAccount
			.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
			.mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));

		const firstLoad = currentAccount.load('first-token');
		const secondLoad = currentAccount.load('second-token');
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
		const loading = currentAccount.load('access-token');

		currentAccount.clear();
		resolveRequest({ data: account('0199c265-34b1-7000-8000-000000000004') });
		await loading;

		expect(currentAccount.status).toBe('idle');
		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.saving).toBe(false);
	});

	it('replaces the local account after updating the profile', async () => {
		const initial = account('0199c265-34b1-7000-8000-000000000005');
		const updated = {
			...initial,
			profile: { ...initial.profile, full_name: 'Ana Sonnda' }
		};
		let resolveUpdate!: (value: { data: Account }) => void;
		getCurrentAccount.mockResolvedValue({ data: initial });
		updateCurrentAccount.mockReturnValue(new Promise((resolve) => (resolveUpdate = resolve)));
		await currentAccount.load('access-token');

		const update = currentAccount.updateProfile('access-token', { full_name: 'Ana Sonnda' });

		expect(currentAccount.status).toBe('ready');
		expect(currentAccount.saving).toBe(true);

		resolveUpdate({ data: updated });
		await update;

		expect(updateCurrentAccount).toHaveBeenCalledWith('access-token', {
			full_name: 'Ana Sonnda'
		});
		expect(currentAccount.account).toEqual(updated);
		expect(currentAccount.status).toBe('ready');
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.saving).toBe(false);
	});

	it.each([400, 401, 403, 409, 422, 500])(
		'preserves the account when an update returns HTTP %i',
		async (status) => {
			const initial = account(`0199c265-34b1-7000-8000-000000000${status}`);
			const problem = { type: 'about:blank', title: 'Update rejected', status };
			getCurrentAccount.mockResolvedValue({ data: initial });
			updateCurrentAccount.mockResolvedValue({ error: problem });
			await currentAccount.load('access-token');

			await currentAccount.updateProfile('access-token', { full_name: 'Another name' });

			expect(currentAccount.account).toEqual(initial);
			expect(currentAccount.status).toBe('ready');
			expect(currentAccount.problem).toEqual(problem);
			expect(currentAccount.saving).toBe(false);
		}
	);

	it('normalizes an update network failure and preserves the account', async () => {
		const initial = account('0199c265-34b1-7000-8000-000000000006');
		getCurrentAccount.mockResolvedValue({ data: initial });
		updateCurrentAccount.mockRejectedValue(new Error('socket details must remain private'));
		await currentAccount.load('access-token');

		await currentAccount.updateProfile('access-token', { full_name: 'Ana Sonnda' });

		expect(currentAccount.account).toEqual(initial);
		expect(currentAccount.problem).toEqual({
			type: 'about:blank',
			title: 'Não foi possível conectar à API'
		});
		expect(currentAccount.status).toBe('ready');
	});

	it('ignores an obsolete profile update after a newer update', async () => {
		const initial = account('0199c265-34b1-7000-8000-000000000007');
		let resolveFirst!: (value: { data: Account }) => void;
		let resolveSecond!: (value: { data: Account }) => void;
		getCurrentAccount.mockResolvedValue({ data: initial });
		updateCurrentAccount
			.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
			.mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));
		await currentAccount.load('access-token');

		const firstUpdate = currentAccount.updateProfile('access-token', { full_name: 'Old name' });
		const secondUpdate = currentAccount.updateProfile('access-token', { full_name: 'Latest name' });
		const latest = {
			...initial,
			profile: { ...initial.profile, full_name: 'Latest name' }
		};

		resolveSecond({ data: latest });
		await secondUpdate;
		resolveFirst({
			data: { ...initial, profile: { ...initial.profile, full_name: 'Old name' } }
		});
		await firstUpdate;

		expect(currentAccount.account).toEqual(latest);
		expect(currentAccount.saving).toBe(false);
	});

	it('invalidates an in-flight update when the account is cleared', async () => {
		const initial = account('0199c265-34b1-7000-8000-000000000008');
		let resolveUpdate!: (value: { data: Account }) => void;
		getCurrentAccount.mockResolvedValue({ data: initial });
		updateCurrentAccount.mockReturnValue(new Promise((resolve) => (resolveUpdate = resolve)));
		await currentAccount.load('access-token');

		const update = currentAccount.updateProfile('access-token', { full_name: 'Old session' });
		currentAccount.clear();
		resolveUpdate({ data: initial });
		await update;

		expect(currentAccount.status).toBe('idle');
		expect(currentAccount.account).toBeNull();
		expect(currentAccount.problem).toBeNull();
		expect(currentAccount.saving).toBe(false);
	});
});
