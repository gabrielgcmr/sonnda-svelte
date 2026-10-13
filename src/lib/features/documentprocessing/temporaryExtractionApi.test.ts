// src/lib/features/documentprocessing/temporaryExtractionApi.test.ts
import { beforeEach, expect, it, vi } from 'vitest';

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('#lib/api/client.js', () => ({ apiClient: { POST: post, GET: get } }));

import {
	createTemporaryExtractionFromCaptures,
	createTemporaryExtractionFromFiles,
	getTemporaryExtraction,
	listTemporaryExtractions,
	retryTemporaryExtraction
} from './temporaryExtractionApi.js';

beforeEach(() => {
	post.mockReset();
	get.mockReset();
});

it('sends ordered files and kind as multipart without setting Content-Type', async () => {
	const files = [new File(['a'], 'a.jpg'), new File(['b'], 'b.png')];
	await createTemporaryExtractionFromFiles('token', 'imaging', files);
	const [path, options] = post.mock.calls[0];
	expect(path).toBe('/temporary-extractions');
	expect(options.headers).toEqual({ Authorization: 'Bearer token' });
	expect(options.body).toBeInstanceOf(FormData);
	expect(options.body.get('kind')).toBe('imaging');
	expect((options.body.getAll('files') as File[]).map((file) => file.name)).toEqual([
		'a.jpg',
		'b.png'
	]);
});

it('scopes capture creation and retrieval to the authenticated API', async () => {
	await createTemporaryExtractionFromCaptures('token', 'laboratory', ['capture-1']);
	await listTemporaryExtractions('token');
	await getTemporaryExtraction('token', 'saved-1');
	await retryTemporaryExtraction('token', 'saved-1');
	expect(post).toHaveBeenCalledWith('/temporary-extractions/from-captures', {
		headers: { Authorization: 'Bearer token' },
		body: { kind: 'laboratory', capture_ids: ['capture-1'] }
	});
	expect(get).toHaveBeenCalledWith('/temporary-extractions/{id}', {
		headers: { Authorization: 'Bearer token' },
		params: { path: { id: 'saved-1' } }
	});
	expect(post).toHaveBeenCalledWith('/temporary-extractions/{id}/retry', {
		headers: { Authorization: 'Bearer token' },
		params: { path: { id: 'saved-1' } }
	});
});
