// src/lib/features/capture/captureQr.test.ts
import { describe, expect, it } from 'vitest';
import { captureCodeFromQr } from './captureQr.js';

describe('captureCodeFromQr', () => {
	it('accepts only a capture QR from this Sonnda origin', () => {
		expect(
			captureCodeFromQr('https://sonnda.com.br/capture?code=abc', 'https://sonnda.com.br')
		).toBe('abc');
		expect(
			captureCodeFromQr('https://other.example/capture?code=abc', 'https://sonnda.com.br')
		).toBeNull();
		expect(
			captureCodeFromQr('https://sonnda.com.br/login?code=abc', 'https://sonnda.com.br')
		).toBeNull();
		expect(captureCodeFromQr('https://sonnda.com.br/capture', 'https://sonnda.com.br')).toBeNull();
	});
});
