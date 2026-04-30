/**
 * Posts routes
 *
 * POST   /api/posts            — create a post
 * GET    /api/posts            — list posts (optional ?style= filter)
 * GET    /api/posts/:id        — get single post
 * DELETE /api/posts/:id        — delete own post
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/supabaseAuthMiddleware";
import { db, authUsersTable, postsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

async function resolveAuthUserId(supabaseUserId: string) {
  const authUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.supabaseUserId, supabaseUserId),
  });
  return authUser ?? null;
}

const createPostSchema = z.object({
  imageUrl: z.string().url(),
  caption:  z.string().max(2000).optional(),
  style:    z.string().max(100).optional(),
  tags:     z.array(z.string().max(50)).max(20).optional(),
});

router.post("/posts", requireAuth, async (req, res) => {
  const supabaseUserId = req.supabaseUserId!;

  const parse = createPostSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
  }

  const authUser = await resolveAuthUserId(supabaseUserId);
  if (!authUser) return res.status(403).json({ error: "User not synced. Call /api/auth/sync first." });

  const { imageUrl, caption, style, tags } = parse.data;

  const [post] = await db
    .insert(postsTable)
    .values({ userId: authUser.id, imageUrl, caption, style, tags })
    .returning();

  await db
    .update(usersTable)
    .set({ postCount: sql`${usersTable.postCount} + 1` })
    .where(eq(usersTable.userId, authUser.id));

  return res.status(201).json(post);
});

router.get("/posts", async (req, res) => {
  const style = typeof req.query.style === "string" ? req.query.style : undefined;

  const rows = await db
    .select({
      id:             postsTable.id,
      imageUrl:       postsTable.imageUrl,
      caption:        postsTable.caption,
      style:          postsTable.style,
      tags:           postsTable.tags,
      likeCount:      postsTable.likeCount,
      saveCount:      postsTable.saveCount,
      commentCount:   postsTable.commentCount,
      createdAt:      postsTable.createdAt,
      supabaseUserId: authUsersTable.supabaseUserId,
      username:       usersTable.username,
      avatarUrl:      usersTable.avatarUrl,
    })
    .from(postsTable)
    .leftJoin(authUsersTable, eq(authUsersTable.id, postsTable.userId))
    .leftJoin(usersTable, eq(usersTable.userId, postsTable.userId))
    .where(style ? eq(postsTable.style, style) : undefined)
    .orderBy(desc(postsTable.createdAt))
    .limit(100);

  return res.status(200).json(rows);
});

router.get("/posts/:id", async (req, res) => {
  const id = String(req.params.id);
  const post = await db.query.postsTable.findFirst({
    where: eq(postsTable.id, id),
  });

  if (!post) return res.status(404).json({ error: "Post not found" });
  return res.status(200).json(post);
});

router.delete("/posts/:id", requireAuth, async (req, res) => {
  const supabaseUserId = req.supabaseUserId!;
  const id = String(req.params.id);

  const authUser = await resolveAuthUserId(supabaseUserId);
  if (!authUser) return res.status(403).json({ error: "User not found" });

  const [deleted] = await db
    .delete(postsTable)
    .where(and(eq(postsTable.id, id), eq(postsTable.userId, authUser.id)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Post not found or not yours" });
  return res.status(200).json({ deleted: true });
});

export default router;
