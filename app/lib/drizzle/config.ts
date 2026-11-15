import {drizzle} from "drizzle-orm/node-postgres";


export const db = drizzle(process.env.ENV === "prod" ? process.env.DATABASE_URL_PROD! : process.env.DATABASE_URL_LOCAL!);