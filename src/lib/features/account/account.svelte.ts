// src/lib/features/account/account.svelte.ts
import { getCurrentAccount, updateCurrentAccount } from './accountApi';
import type { Account, AccountProblem, AccountStatus, UpdateAccountInput } from './types';

function fallbackProblem(title: string): AccountProblem {
	return {
		type: 'about:blank',
		title
	};
}

class AccountState {
	status = $state<AccountStatus>('idle');
	account = $state.raw<Account | null>(null);
	problem = $state.raw<AccountProblem | null>(null);
	saving = $state(false);

	#requestVersion = 0;

	clear() {
		this.#requestVersion += 1;
		this.status = 'idle';
		this.account = null;
		this.problem = null;
		this.saving = false;
	}

	async load(accessToken: string) {
		const requestVersion = ++this.#requestVersion;
		this.status = 'loading';
		this.account = null;
		this.problem = null;
		this.saving = false;

		try {
			const { data, error } = await getCurrentAccount(accessToken);

			if (requestVersion !== this.#requestVersion) return;

			if (data) {
				this.account = data;
				this.status = 'ready';
				return;
			}

			this.problem = error ?? fallbackProblem('Não foi possível carregar a conta');
			this.status = 'error';
		} catch {
			if (requestVersion !== this.#requestVersion) return;

			this.problem = fallbackProblem('Não foi possível conectar à API');
			this.status = 'error';
		}
	}

	async updateProfile(accessToken: string, input: UpdateAccountInput) {
		const requestVersion = ++this.#requestVersion;
		const previousAccount = this.account;
		this.saving = true;
		this.problem = null;

		try {
			const { data, error } = await updateCurrentAccount(accessToken, input);

			if (requestVersion !== this.#requestVersion) return;

			if (data) {
				this.account = data;
				this.status = 'ready';
				return;
			}

			this.account = previousAccount;
			this.problem = error ?? fallbackProblem('Não foi possível atualizar o perfil');
			this.status = previousAccount ? 'ready' : 'error';
		} catch {
			if (requestVersion !== this.#requestVersion) return;

			this.account = previousAccount;
			this.problem = fallbackProblem('Não foi possível conectar à API');
			this.status = previousAccount ? 'ready' : 'error';
		} finally {
			if (requestVersion === this.#requestVersion) {
				this.saving = false;
			}
		}
	}
}

export const currentAccount = new AccountState();
