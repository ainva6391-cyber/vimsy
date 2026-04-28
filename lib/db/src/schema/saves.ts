import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { authUsersTable } from "./auth-users";
import { postsTable } from "./posts";

export const savesTable = pgTable(
  "saves",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    postId:    uuid("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
    userId:    uuid("user_id").notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.postId, t.userId)],
);

export const insertSaveSchema = createInsertSchema(savesTable).omit({
  id: true,
  createdAt: true,
});

export const selectSaveSchema = createSelectSchema(savesTable);

export type InsertSave = z.infer<typeof insertSaveSchema>;
export type Save = typeof savesTable.$inferSelect;
