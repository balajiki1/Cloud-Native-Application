import dotenv from "dotenv"
dotenv.config()

const DB_HOST = process.env.DB_HOST || "localhost"
const DB_USER = process.env.DB_USER || "rebecca"
const DB_PASSWORD = process.env.DB_PASSWORD || "rebecca"
const DB_DATABASE = process.env.DB_DATABASE || "webapp"
const DB_PORT = process.env.DB_PORT || 5432

export const dbEnvConfig = {
    development: {
        HOST: DB_HOST,
        USER: DB_USER,
        PASSWORD: DB_PASSWORD,
        DB: DB_DATABASE,
        PORT: DB_PORT,
        dialect: "postgres",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    test: {
        HOST: DB_HOST,
        USER: DB_USER,
        PASSWORD: DB_PASSWORD,
        DB: process.env.DB_TEST_DATABASE,
        PORT: DB_PORT,
        dialect: "postgres",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};