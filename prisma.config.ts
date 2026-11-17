import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/thundera?schema=public';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    provider: 'postgresql',
    url: databaseUrl,
  },
});
