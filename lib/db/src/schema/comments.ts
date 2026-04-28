import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { authUsersTable } from "./auth-users";
import { postsTable } from "./posts";

export const commentsTable = pgTable("comments", {
  id:        uuid("id").primaryKey().defaultRandom(),
  postId:    uuid("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
  content:   text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCommentSchema = createSelectSchema(commentsTable);

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
