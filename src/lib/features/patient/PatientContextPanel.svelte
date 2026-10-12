<!-- src/lib/features/patient/PatientContextPanel.svelte -->
<script lang="ts">
	import PatientIdentity from '#lib/layout/PatientIdentity.svelte';
	import PatientNavigation from '#lib/layout/PatientNavigation.svelte';
	import type { PatientSection } from './navigation.js';
	import {
		formatPatientCpf,
		formatPatientDate,
		patientAge,
		patientGenderLabel,
		patientRaceLabel
	} from './presentation.js';
	import type { Patient } from './types.js';

	type Props = {
		patient: Patient;
		patientId: string;
		activeSection: PatientSection;
	};

	let { patient, patientId, activeSection }: Props = $props();
</script>

<aside
	aria-label="Contexto do paciente"
	class="flex max-h-[calc(100dvh-3rem)] w-full shrink-0 flex-col overflow-y-auto rounded-2xl border border-border bg-surface shadow-sm @min-[48rem]/workspace:sticky @min-[48rem]/workspace:top-6 @min-[48rem]/workspace:w-[280px]"
>
	<PatientIdentity
		fullName={patient.full_name}
		age={patientAge(patient.birth_date)}
		birthDate={formatPatientDate(patient.birth_date)}
		cpf={formatPatientCpf(patient.cpf)}
		cns={patient.cns}
		phone={patient.phone}
		gender={patientGenderLabel(patient.gender)}
		race={patientRaceLabel(patient.race)}
	/>
	<div class="border-t border-border p-3">
		<PatientNavigation {patientId} {activeSection} />
	</div>
</aside>
