// src/lib/features/patient/patientWorkspace.svelte.ts
import { getPatient, listAccessiblePatients } from './patientApi.js';
import type { AccessiblePatient, Patient, PatientLoadStatus, PatientProblem } from './types.js';

export const PATIENT_PAGE_SIZE = 100;

function fallbackProblem(title: string): PatientProblem {
	return { type: 'about:blank', title };
}

export function normalizePatientName(value: string) {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLocaleLowerCase('pt-BR')
		.trim();
}

class PatientWorkspace {
	accountId = $state<string | null>(null);
	patients = $state.raw<AccessiblePatient[]>([]);
	query = $state('');
	total = $state(0);
	listStatus = $state<PatientLoadStatus>('idle');
	listComplete = $state(false);
	listProblem = $state.raw<PatientProblem | null>(null);

	selectedPatientId = $state<string | null>(null);
	selectedPatient = $state.raw<Patient | null>(null);
	patientStatus = $state<PatientLoadStatus>('idle');
	patientProblem = $state.raw<PatientProblem | null>(null);

	#listRequestVersion = 0;
	#patientRequestVersion = 0;

	get filteredPatients() {
		const normalizedQuery = normalizePatientName(this.query);
		if (!normalizedQuery) return this.patients;

		return this.patients.filter((patient) =>
			normalizePatientName(patient.full_name).includes(normalizedQuery)
		);
	}

	#useAccount(accountId: string) {
		if (this.accountId === accountId) return;
		this.clear();
		this.accountId = accountId;
	}

	clear() {
		this.#listRequestVersion += 1;
		this.#patientRequestVersion += 1;
		this.accountId = null;
		this.patients = [];
		this.query = '';
		this.total = 0;
		this.listStatus = 'idle';
		this.listComplete = false;
		this.listProblem = null;
		this.selectedPatientId = null;
		this.selectedPatient = null;
		this.patientStatus = 'idle';
		this.patientProblem = null;
	}

	ensureList(accessToken: string, accountId: string) {
		this.#useAccount(accountId);
		if (this.listStatus === 'loading' || this.listStatus === 'ready') return;
		return this.reloadList(accessToken, accountId);
	}

	async reloadList(accessToken: string, accountId: string) {
		this.#useAccount(accountId);
		const requestVersion = ++this.#listRequestVersion;
		this.patients = [];
		this.total = 0;
		this.listStatus = 'loading';
		this.listComplete = false;
		this.listProblem = null;

		let offset = 0;

		try {
			while (true) {
				const { data, error } = await listAccessiblePatients(
					accessToken,
					PATIENT_PAGE_SIZE,
					offset
				);

				if (requestVersion !== this.#listRequestVersion || this.accountId !== accountId) return;

				if (!data) {
					this.listProblem = error ?? fallbackProblem('Não foi possível carregar os pacientes');
					this.listStatus = 'error';
					return;
				}

				const page = data.patients ?? [];
				this.total = data.total;
				this.patients = [...this.patients, ...page];
				offset += page.length;

				if (offset >= data.total) {
					this.listComplete = true;
					this.listStatus = 'ready';
					return;
				}

				if (page.length === 0) {
					this.listProblem = fallbackProblem('A API retornou uma página de pacientes incompleta');
					this.listStatus = 'error';
					return;
				}
			}
		} catch {
			if (requestVersion !== this.#listRequestVersion || this.accountId !== accountId) return;
			this.listProblem = fallbackProblem('Não foi possível conectar à API');
			this.listStatus = 'error';
		}
	}

	ensurePatient(accessToken: string, accountId: string, patientId: string) {
		this.#useAccount(accountId);
		if (
			this.selectedPatientId === patientId &&
			(this.patientStatus === 'loading' || this.patientStatus === 'ready')
		) {
			return;
		}
		return this.reloadPatient(accessToken, accountId, patientId);
	}

	async reloadPatient(accessToken: string, accountId: string, patientId: string) {
		this.#useAccount(accountId);
		const requestVersion = ++this.#patientRequestVersion;
		this.selectedPatientId = patientId;
		this.selectedPatient = null;
		this.patientStatus = 'loading';
		this.patientProblem = null;

		try {
			const { data, error } = await getPatient(accessToken, patientId);

			if (
				requestVersion !== this.#patientRequestVersion ||
				this.accountId !== accountId ||
				this.selectedPatientId !== patientId
			) {
				return;
			}

			if (data) {
				this.selectedPatient = data;
				this.patientStatus = 'ready';
				return;
			}

			this.patientProblem = error ?? fallbackProblem('Não foi possível carregar o paciente');
			this.patientStatus = 'error';
		} catch {
			if (
				requestVersion !== this.#patientRequestVersion ||
				this.accountId !== accountId ||
				this.selectedPatientId !== patientId
			) {
				return;
			}
			this.patientProblem = fallbackProblem('Não foi possível conectar à API');
			this.patientStatus = 'error';
		}
	}
}

export const patientWorkspace = new PatientWorkspace();
