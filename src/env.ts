// src/env.ts
import { defineEnvVars } from '@sveltejs/kit/env';

const defaultAPIURL = 'http://localhost:8080';

export const variables = defineEnvVars({
	PUBLIC_API_URL: {
		public: true,
		static: true,
		schema: (value) => value?.trim().replace(/\/+$/, '') || defaultAPIURL
	},
	PUBLIC_SUPABASE_URL: {
		public: true,
		static: true
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		static: true
	}
});
