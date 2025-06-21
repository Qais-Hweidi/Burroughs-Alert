import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/database/schema.sql.ts',
  out: './data/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./data/app.db',
  },
});