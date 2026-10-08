// src/lib/account.svelte.ts
import type { Session } from '@supabase/supabase-js';
import type { components } from './generated/openapi';
import { apiClient } from './apiClient';

export type Account = components['schemas']['AccountResponse'];
export type AccountProblem = components['schemas']['ErrorModel'];

class AccountState {
	account = $state.raw<Account | null>(null);
	problem = $state.raw<AccountProblem | null>(null);
	loading = $state(false);

	#requestVersion = 0;

	clear() {
		this.#requestVersion += 1;
		this.account = null;
		this.problem = null;
		this.loading = false;
	}

	async load(session: Session) {
		const requestVersion = ++this.#requestVersion;
		this.loading = true;
		this.problem = null;

		try {
			const { data, error } = await apiClient.GET('/me', {
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			});

			if (requestVersion !== this.#requestVersion) return;

			if (data) {
				this.account = data;
				return;
			}

			this.account = null;
			this.problem = error ?? {
				type: 'about:blank',
				title: 'Não foi possível carregar a conta'
			};
		} catch {
			if (requestVersion !== this.#requestVersion) return;

			this.account = null;
			this.problem = {
				type: 'about:blank',
				title: 'Não foi possível conectar à API'
			};
		} finally {
			if (requestVersion === this.#requestVersion) {
				this.loading = false;
			}
		}
	}
}

export const currentAccount = new AccountState();
