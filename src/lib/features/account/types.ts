// src/lib/features/account/types.ts
import type { components } from '#lib/generated/openapi.js';

export type Account = components['schemas']['AccountResponse'];
export type AccountProblem = components['schemas']['ErrorModel'];
export type UpdateAccountInput = components['schemas']['UpdateAccountRequest'];
