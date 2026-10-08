// src/lib/auth-sign-up.test.ts
import type { Session, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	signUp: vi.fn(),
	loadAccount: vi.fn(),
	clearAccount: vi.fn()
}));

vi.mock('./supabaseClient', () => ({
	supabase: {
		auth: {
			signUp: mocks.signUp
		}
	}
}));

vi.mock('./account.svelte', () => ({
	currentAccount: {
		load: mocks.loadAccount,
		clear: mocks.clearAccount
	}
}));

import { destroyAuth, signUp } from './auth.svelte';

const user = { id: '0199c265-34b1-7000-8000-000000000010' } as User;
const session = { access_token: 'access-token', user } as Session;

beforeEach(() => {
	destroyAuth();
	mocks.signUp.mockReset();
	mocks.loadAccount.mockReset();
	mocks.clearAccount.mockReset();
});

describe('signUp', () => {
	it('waits for email confirmation without provisioning an account when no session is returned', async () => {
		mocks.signUp.mockResolvedValue({ data: { user, session: null }, error: null });

		const result = await signUp('person@example.com', 'provider-policy-password');

		expect(mocks.signUp).toHaveBeenCalledWith({
			email: 'person@example.com',
			password: 'provider-policy-password'
		});
		expect(result.session).toBeNull();
		expect(mocks.loadAccount).not.toHaveBeenCalled();
	});

	it('loads the domain account when Supabase creates a session immediately', async () => {
		mocks.signUp.mockResolvedValue({ data: { user, session }, error: null });
		mocks.loadAccount.mockResolvedValue(undefined);

		const result = await signUp('person@example.com', 'provider-policy-password');

		expect(result.session).toBe(session);
		expect(mocks.loadAccount).toHaveBeenCalledWith(session);
	});

	it('preserves the Supabase error without attempting account provisioning', async () => {
		const error = Object.assign(new Error('weak password'), { code: 'weak_password' });
		mocks.signUp.mockResolvedValue({ data: { user: null, session: null }, error });

		await expect(signUp('person@example.com', 'weak')).rejects.toBe(error);
		expect(mocks.loadAccount).not.toHaveBeenCalled();
	});
});
