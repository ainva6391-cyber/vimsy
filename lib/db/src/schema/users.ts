import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { authUsersTable } from "./auth-users";

export const usersTable = pgTable("users", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id").notNull().unique().references(() => authUsersTable.id, { onDelete: "cascade" }),
  username:       text("username").notNull().unique(),
  displayName:    text("display_name"),
  avatarUrl:      text("avatar_url"),
  bio:            text("bio"),
  styleTags:      text("style_tags").array(),
  followerCount:  integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  postCount:      integer("post_count").notNull().default(0),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(usersTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
