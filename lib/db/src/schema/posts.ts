import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { authUsersTable } from "./auth-users";

export const postsTable = pgTable("posts", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
  imageUrl:     text("image_url").notNull(),
  caption:      text("caption"),
  style:        text("style"),
  tags:         text("tags").array(),
  saveCount:    integer("save_count").notNull().default(0),
  likeCount:    integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  saveCount: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const selectPostSchema = createSelectSchema(postsTable);

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
