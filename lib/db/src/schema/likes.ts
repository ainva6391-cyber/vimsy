import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { authUsersTable } from "./auth-users";
import { postsTable } from "./posts";

export const likesTable = pgTable(
  "likes",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    postId:    uuid("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
    userId:    uuid("user_id").notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.postId, t.userId)],
);

export const insertLikeSchema = createInsertSchema(likesTable).omit({
  id: true,
  createdAt: true,
});

export const selectLikeSchema = createSelectSchema(likesTable);

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likesTable.$inferSelect;
