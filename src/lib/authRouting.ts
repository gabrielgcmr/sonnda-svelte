// src/lib/authRouting.ts
const loginPath = '/login';
const registerPath = '/register';
const homePath = '/home';

function normalizePath(pathname: string) {
	return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function isAuthManagedRoute(pathname: string) {
	const path = normalizePath(pathname);
	return path === '/' || path === loginPath || path === registerPath || path === homePath;
}

export function authRedirect(pathname: string, authenticated: boolean) {
	const path = normalizePath(pathname);

	if (path === '/') {
		return authenticated ? homePath : loginPath;
	}
	if ((path === loginPath || path === registerPath) && authenticated) {
		return homePath;
	}
	if (path === homePath && !authenticated) {
		return loginPath;
	}

	return null;
}
