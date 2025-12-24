import 'dotenv/config.js';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ne } from 'drizzle-orm';

if (process.env.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export { db, ne };
