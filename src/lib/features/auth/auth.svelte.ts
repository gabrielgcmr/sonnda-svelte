// src/lib/features/auth/auth.svelte.ts
import type { Session, User } from '@supabase/supabase-js';
import { currentAccount } from '#lib/features/account/account.svelte.js';
import { patientWorkspace } from '#lib/features/patient/patientWorkspace.svelte.js';
import { supabase } from './supabaseClient';

class Auth {
	session = $state.raw<Session | null>(null);
	user = $derived<User | null>(this.session?.user ?? null);
	ready = $state(false);
	initializationError = $state.raw<Error | null>(null);

	#initialization: Promise<void> | null = null;
	#unsubscribe: (() => void) | null = null;
	#generation = 0;

	async #applySession(session: Session | null, force = false) {
		const changed = this.session?.access_token !== session?.access_token;
		const identityChanged = this.session?.user.id !== session?.user.id;
		this.session = session;

		if (!changed && !force) return;
		if (identityChanged) patientWorkspace.clear();
		if (!session) {
			currentAccount.clear();
			patientWorkspace.clear();
			return;
		}

		await currentAccount.load(session.access_token);
	}

	async #initialize(generation: number) {
		this.ready = false;
		this.initializationError = null;

		const {
			data: { session },
			error
		} = await supabase.auth.getSession();
		if (error) throw error;
		if (generation !== this.#generation) return;

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			if (generation === this.#generation) {
				void this.#applySession(nextSession);
			}
		});
		this.#unsubscribe = () => subscription.unsubscribe();

		await this.#applySession(session, true);
	}

	initAuth = () => {
		if (!this.#initialization) {
			const generation = ++this.#generation;
			this.#initialization = this.#initialize(generation)
				.catch((error: unknown) => {
					if (generation !== this.#generation) return;
					this.initializationError =
						error instanceof Error ? error : new Error('Não foi possível iniciar a autenticação');
					this.#initialization = null;
				})
				.finally(() => {
					if (generation === this.#generation) {
						this.ready = true;
					}
				});
		}

		return this.#initialization;
	};

	signIn = async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw error;
		await this.#applySession(data.session, true);
		return data;
	};

	signUp = async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signUp({ email, password });
		if (error) throw error;

		if (data.session) {
			await this.#applySession(data.session, true);
		}

		return data;
	};

	signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		await this.#applySession(null);
	};

	destroy = () => {
		this.#generation += 1;
		this.#unsubscribe?.();
		this.#unsubscribe = null;
		this.#initialization = null;
		this.session = null;
		this.ready = false;
		this.initializationError = null;
		currentAccount.clear();
		patientWorkspace.clear();
	};
}

export const auth = new Auth();

export function initAuth() {
	return auth.initAuth();
}

export function signIn(email: string, password: string) {
	return auth.signIn(email, password);
}

export function signUp(email: string, password: string) {
	return auth.signUp(email, password);
}

export function signOut() {
	return auth.signOut();
}

export function destroyAuth() {
	auth.destroy();
}
