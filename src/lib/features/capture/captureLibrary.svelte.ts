// src/lib/features/capture/captureLibrary.svelte.ts
import { listInboxCaptures } from './desktopCaptureApi.js';
import type { InboxCapture } from './desktopCapture.svelte.js';

export const captureLibraryPageSize = 20;
export const captureLibraryPollIntervalMs = 5_000;

const listProblem = 'Não foi possível atualizar os arquivos recebidos.';

export class CaptureLibrary {
	items = $state.raw<InboxCapture[]>([]);
	hasMore = $state(false);
	loading = $state(false);
	loadingMore = $state(false);
	problem = $state<string | null>(null);

	#accountId: string | null = null;
	#accessToken: string | null = null;
	#generation = 0;
	#visible = true;
	#open = false;
	#timer: ReturnType<typeof setInterval> | null = null;

	bindAccount(accountId: string | null, accessToken: string | null) {
		this.#accessToken = accessToken;
		if (this.#accountId === accountId) return false;
		this.#accountId = accountId;
		this.#generation += 1;
		this.#stopPolling();
		this.items = [];
		this.hasMore = false;
		this.loading = false;
		this.loadingMore = false;
		this.problem = null;
		return true;
	}

	setVisible(visible: boolean) {
		if (this.#visible === visible) return;
		this.#visible = visible;
		if (!visible) {
			this.#stopPolling();
			return;
		}
		if (!this.#open) return;
		void this.refresh();
		this.#startPolling();
	}

	async open() {
		this.#open = true;
		const generation = ++this.#generation;
		this.items = [];
		this.hasMore = false;
		this.problem = null;
		await this.#load({ generation, offset: 0, append: false });
		if (generation !== this.#generation || !this.#open || !this.#visible) return;
		this.#startPolling();
	}

	close() {
		this.#open = false;
		this.#generation += 1;
		this.#stopPolling();
	}

	refresh() {
		return this.#load({
			generation: this.#generation,
			offset: 0,
			append: false,
			limit: Math.min(100, Math.max(captureLibraryPageSize, this.items.length)),
			preserveOnFailure: true
		});
	}

	loadMore() {
		if (!this.hasMore || this.loading || this.loadingMore) return Promise.resolve();
		return this.#load({
			generation: this.#generation,
			offset: this.items.length,
			append: true
		});
	}

	async #load(options: {
		generation: number;
		offset: number;
		append: boolean;
		limit?: number;
		preserveOnFailure?: boolean;
	}) {
		const token = this.#accessToken;
		const accountId = this.#accountId;
		if (!token || !accountId) return;
		if (options.append) this.loadingMore = true;
		else if (!options.preserveOnFailure) this.loading = true;
		try {
			const result = await listInboxCaptures(token, {
				limit: options.limit ?? captureLibraryPageSize,
				offset: options.offset
			});
			if (options.generation !== this.#generation || this.#accountId !== accountId) return;
			if (!result.data) {
				this.problem = listProblem;
				return;
			}
			const incoming = result.data.items ?? [];
			this.items = options.append ? [...this.items, ...incoming] : incoming;
			this.hasMore = result.data.has_more;
			if (this.problem === listProblem) this.problem = null;
		} catch {
			if (options.generation === this.#generation) this.problem = listProblem;
		} finally {
			if (options.generation === this.#generation) {
				this.loading = false;
				this.loadingMore = false;
			}
		}
	}

	#startPolling() {
		this.#stopPolling();
		if (!this.#open || !this.#visible || !this.#accessToken) return;
		this.#timer = setInterval(() => {
			void this.refresh();
		}, captureLibraryPollIntervalMs);
	}

	#stopPolling() {
		if (!this.#timer) return;
		clearInterval(this.#timer);
		this.#timer = null;
	}
}
