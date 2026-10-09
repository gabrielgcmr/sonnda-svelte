// src/lib/features/auth/routing.test.ts
import { describe, expect, it } from 'vitest';
import { authRedirect, isAuthManagedRoute, type RouteAccountState } from './routing';

const anonymous: RouteAccountState = {
	authenticated: false,
	accountStatus: 'idle',
	onboardingCompleted: null
};
const incomplete: RouteAccountState = {
	authenticated: true,
	accountStatus: 'ready',
	onboardingCompleted: false
};
const complete: RouteAccountState = { ...incomplete, onboardingCompleted: true };

describe('authRedirect', () => {
	it.each([
		['/', anonymous, '/login'],
		['/login', anonymous, null],
		['/register', anonymous, null],
		['/home', anonymous, '/login'],
		['/home/exams', anonymous, '/login'],
		['/home/calculators', anonymous, '/login'],
		['/patients/patient-id', anonymous, '/login'],
		['/onboarding', anonymous, '/login'],
		['/', incomplete, '/onboarding'],
		['/login', incomplete, '/onboarding'],
		['/register', incomplete, '/onboarding'],
		['/home', incomplete, '/onboarding'],
		['/home/exams', incomplete, '/onboarding'],
		['/home/calculators', incomplete, '/onboarding'],
		['/patients/patient-id', incomplete, '/onboarding'],
		['/onboarding', incomplete, null],
		['/', complete, '/home'],
		['/login', complete, '/home'],
		['/register', complete, '/home'],
		['/home', complete, null],
		['/home/exams', complete, null],
		['/home/calculators', complete, null],
		['/patients/patient-id', complete, null],
		['/onboarding', complete, '/home']
	] as const)('resolves %s for account state %#', (path, state, expected) => {
		expect(authRedirect(path, state)).toBe(expected);
	});

	it.each(['idle', 'loading', 'error'] as const)('waits during account %s', (accountStatus) => {
		for (const path of ['/', '/login', '/register', '/home', '/onboarding']) {
			expect(authRedirect(path, { ...incomplete, accountStatus })).toBeNull();
		}
	});

	it('waits when the account has no completion result', () => {
		expect(authRedirect('/home', { ...incomplete, onboardingCompleted: null })).toBeNull();
	});

	it('handles trailing slashes and unrelated routes', () => {
		expect(authRedirect('/home/', incomplete)).toBe('/onboarding');
		expect(authRedirect('/onboarding/', complete)).toBe('/home');
		expect(authRedirect('/health', incomplete)).toBeNull();
	});
});

describe('isAuthManagedRoute', () => {
	it.each([
		'/',
		'/login',
		'/login/',
		'/register',
		'/register/',
		'/home',
		'/home/',
		'/home/exams',
		'/home/calculators/',
		'/patients/patient-id',
		'/patients/new',
		'/onboarding',
		'/onboarding/'
	])('includes %s', (path) => {
		expect(isAuthManagedRoute(path)).toBe(true);
	});

	it('excludes unrelated routes', () => {
		expect(isAuthManagedRoute('/health')).toBe(false);
		expect(isAuthManagedRoute('/homeopathy')).toBe(false);
		expect(isAuthManagedRoute('/patients-archive')).toBe(false);
	});
});
