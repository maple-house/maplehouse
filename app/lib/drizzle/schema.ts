import { bigserial, boolean, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

//
export const roleEnum = pgEnum('role', ["admin","client"]);

//User Table
export const UserTable = pgTable("user", {
    id: bigserial({mode : "bigint"}).primaryKey(),
    first_name : varchar("first_name", {length : 200}).notNull(),
    last_name : varchar("last_name", {length : 200}).notNull(),
    email : varchar("email", {length : 250}).notNull().unique(),
    contact: varchar("contact",{length : 10}).notNull().unique(),
    gender : varchar("gender", {length : 10}).notNull(),
    address : varchar("address", {length : 300}),
    created_at : timestamp({withTimezone : true}).notNull().defaultNow(),
    updated_at : timestamp({withTimezone : true}).notNull().defaultNow().$onUpdate(() => new Date()),
    archived : boolean().notNull().default(false),
    role : roleEnum().notNull()
});