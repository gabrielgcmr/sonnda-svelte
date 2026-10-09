// src/lib/features/labextraction/types.ts
import type { components } from '#lib/generated/openapi.js';

export type LabExtractionResult = components['schemas']['Result'];
export type LabExtractionProblem = components['schemas']['ErrorModel'];
export type LabExtractionStatus = 'idle' | 'processing' | 'ready' | 'error';
export type ExtractionWarning = components['schemas']['ExtractionWarning'];
export type ExtractedLabReport = components['schemas']['ExtractedLabReport'];
