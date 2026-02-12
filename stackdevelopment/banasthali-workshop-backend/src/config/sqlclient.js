import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from '../model/index.js';
import { ENV_CONFIG } from "./envconfig.js";

console.log(ENV_CONFIG);

const pool = new Pool({
    host: ENV_CONFIG.db.host,
    port: ENV_CONFIG.db.port,
    user: ENV_CONFIG.db.user,
    password: ENV_CONFIG.db.password,
    database: ENV_CONFIG.db.database,
    // ssl: {
    //     rejectUnauthorized: ENV_CONFIG.db.ssl
    // },
    // ssl: ENV_CONFIG.db.ssl,
    ssl: {
        rejectUnauthorized: ENV_CONFIG.db.ssl
    },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const postgreDb = drizzle(pool, { schema: {...schema}});

export default postgreDb;