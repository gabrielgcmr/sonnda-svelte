// src/lib/features/patient/types.ts
import type { components } from '#lib/generated/openapi.js';

export type PatientLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type AccessiblePatient = components['schemas']['AccessiblePatientResponse'];
export type Patient = components['schemas']['PatientResponse'];
export type PatientProblem = components['schemas']['ErrorModel'];
export type CreatePatientInput = components['schemas']['CreatePatientRequest'];
