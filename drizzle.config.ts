import { defineConfig } from "drizzle-kit";


export default defineConfig({
    schema : "./app/lib/drizzle/schema.ts",
    out : "./app/lib/drizzle/migrations",
    dialect : "postgresql",
    dbCredentials : {
        url : process.env.DATABASE_URL! 
    },
    verbose : true,
    strict : true,
})