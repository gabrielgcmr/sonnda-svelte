// src/lib/features/auth/routing.ts
import type { AccountStatus } from '#lib/features/account/types.js';
const loginPath = '/login';
const registerPath = '/register';
const homePath = '/home';
const onboardingPath = '/onboarding';
const authenticatedRouteRoots = [homePath, '/patients'] as const;

export type RouteAccountState = {
	authenticated: boolean;
	accountStatus: AccountStatus;
	onboardingCompleted: boolean | null;
};

function normalizePath(pathname: string) {
	return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function isWithin(path: string, root: string) {
	return path === root || path.startsWith(`${root}/`);
}

function isAuthenticatedRoute(path: string) {
	return authenticatedRouteRoots.some((root) => isWithin(path, root));
}

export function isAuthManagedRoute(pathname: string) {
	const path = normalizePath(pathname);
	return (
		['/', loginPath, registerPath, onboardingPath].includes(path) || isAuthenticatedRoute(path)
	);
}

export function authRedirect(pathname: string, state: RouteAccountState) {
	const path = normalizePath(pathname);

	if (!isAuthManagedRoute(path)) return null;
	if (!state.authenticated) {
		return path === '/' || path === onboardingPath || isAuthenticatedRoute(path) ? loginPath : null;
	}
	if (state.accountStatus !== 'ready' || state.onboardingCompleted === null) return null;

	const destination = state.onboardingCompleted ? homePath : onboardingPath;
	if (path === '/' || path === loginPath || path === registerPath) return destination;
	if (isAuthenticatedRoute(path) && !state.onboardingCompleted) return onboardingPath;
	if (path === onboardingPath && state.onboardingCompleted) return homePath;

	return null;
}
