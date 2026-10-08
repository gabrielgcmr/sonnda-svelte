// src/lib/apiClient.ts
import createClient from 'openapi-fetch';
import { PUBLIC_API_URL } from '$app/env/public';
import type { paths } from './generated/openapi';

export const apiClient = createClient<paths>({ baseUrl: PUBLIC_API_URL });
