// src/lib/features/labextraction/fileValidation.ts
export {
	MAX_DOCUMENT_BYTES as MAX_LAB_DOCUMENT_BYTES,
	validateDocument as validateLabDocument
} from '../documentprocessing/fileValidation.js';
export type { DocumentValidationResult as LabDocumentValidationResult } from '../documentprocessing/fileValidation.js';
