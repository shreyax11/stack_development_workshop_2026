import dotenv from 'dotenv';
dotenv.config();
const env = process.env.NODE_ENV || 'development';

console.log(process.env.PORT);
export const ENV_CONFIG = {
    PORT: process.env.PORT || 8000,
    JWT_SECRET: process.env.JWT_SECRET,
    ENV: env,
    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true'
    }
}