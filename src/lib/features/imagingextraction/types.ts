// src/lib/features/imagingextraction/types.ts
import type { components } from '#lib/generated/openapi.js';

export type ImagingReportResult = components['schemas']['ImagingReportResult'];
export type ImagingExtractionProblem = components['schemas']['ErrorModel'];
export type ImagingExtractionStatus = 'idle' | 'processing' | 'ready' | 'error';
export type ImagingExtractionCapture = Pick<
	components['schemas']['CaptureResponse'],
	'id' | 'original_filename' | 'mime_type' | 'size_bytes'
>;
