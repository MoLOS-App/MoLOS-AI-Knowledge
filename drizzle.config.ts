import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './lib/server/db/schema/tables.ts',
	out: './drizzle',
	dialect: 'sqlite',
	tsconfig: './tsconfig.json',
	dbCredentials: {
		url: 'dev.db'
	}
});
