import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const authUsersTable = pgTable("auth_users", {
  id:          uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email:       text("email").notNull().unique(),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuthUserSchema = createInsertSchema(authUsersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAuthUserSchema = createSelectSchema(authUsersTable);

export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
export type AuthUser = typeof authUsersTable.$inferSelect;
