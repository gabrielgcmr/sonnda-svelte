// src/lib/features/auth/routing.test.ts
import { describe, expect, it } from 'vitest';
import { authRedirect, isAuthManagedRoute } from './routing';

describe('authRedirect', () => {
	it.each([
		['/', false, '/login'],
		['/', true, '/home'],
		['/login', true, '/home'],
		['/login', false, null],
		['/register', true, '/home'],
		['/register', false, null],
		['/home', false, '/login'],
		['/home', true, null]
	] as const)('resolves %s with authenticated=%s to %s', (path, authenticated, expected) => {
		expect(authRedirect(path, authenticated)).toBe(expected);
	});

	it('handles trailing slashes without changing the decision', () => {
		expect(authRedirect('/home/', false)).toBe('/login');
		expect(authRedirect('/login/', true)).toBe('/home');
		expect(authRedirect('/register/', true)).toBe('/home');
	});

	it('does not redirect unrelated routes', () => {
		expect(authRedirect('/health', false)).toBeNull();
	});
});

describe('isAuthManagedRoute', () => {
	it.each(['/', '/login', '/login/', '/register', '/register/', '/home', '/home/'])(
		'includes %s',
		(path) => {
			expect(isAuthManagedRoute(path)).toBe(true);
		}
	);

	it('excludes unrelated routes', () => {
		expect(isAuthManagedRoute('/health')).toBe(false);
	});
});
