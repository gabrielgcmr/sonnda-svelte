// src/lib/features/capture/captureQr.ts
export function captureCodeFromQr(value: string, origin: string): string | null {
	try {
		const url = new URL(value);
		if (url.origin !== origin || url.pathname !== '/capture') return null;
		return url.searchParams.get('code')?.trim() || null;
	} catch {
		return null;
	}
}
