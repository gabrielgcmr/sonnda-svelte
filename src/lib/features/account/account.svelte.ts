// src/lib/features/account/account.svelte.ts
import {
	activateCurrentAccountAsProfessional,
	getCurrentAccount,
	updateCurrentAccount
} from './accountApi';
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
	activatingProfessional = $state(false);
	professionalActivationProblem = $state.raw<AccountProblem | null>(null);

	#requestVersion = 0;
	#professionalActivationVersion = 0;

	clear() {
		this.#requestVersion += 1;
		this.#professionalActivationVersion += 1;
		this.status = 'idle';
		this.account = null;
		this.problem = null;
		this.saving = false;
		this.activatingProfessional = false;
		this.professionalActivationProblem = null;
	}

	clearProfessionalActivationProblem() {
		this.professionalActivationProblem = null;
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

	async activateProfessional(accessToken: string, password: string) {
		const requestVersion = ++this.#professionalActivationVersion;
		this.activatingProfessional = true;
		this.professionalActivationProblem = null;

		try {
			const { data, error } = await activateCurrentAccountAsProfessional(accessToken, {
				password
			});

			if (requestVersion !== this.#professionalActivationVersion) return false;

			if (data) {
				this.account = data;
				this.status = 'ready';
				return true;
			}

			this.professionalActivationProblem =
				error ?? fallbackProblem('Não foi possível ativar o perfil profissional');
			return false;
		} catch {
			if (requestVersion !== this.#professionalActivationVersion) return false;

			this.professionalActivationProblem = fallbackProblem('Não foi possível conectar à API');
			return false;
		} finally {
			if (requestVersion === this.#professionalActivationVersion) {
				this.activatingProfessional = false;
			}
		}
	}
}

export const currentAccount = new AccountState();
