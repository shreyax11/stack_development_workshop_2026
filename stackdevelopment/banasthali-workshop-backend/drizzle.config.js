import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { ENV_CONFIG } from './src/config/envconfig';

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle/development',
  schema: './src/model/index.js',
  dbCredentials: {
    host: ENV_CONFIG.db.host,
    port: ENV_CONFIG.db.port,
    user: ENV_CONFIG.db.user,
    password: ENV_CONFIG.db.password,
    database: ENV_CONFIG.db.database,
    ssl: {
      rejectUnauthorized: ENV_CONFIG.db.ssl
    }
  }
});
