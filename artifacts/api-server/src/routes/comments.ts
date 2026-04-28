/**
 * Comments routes
 *
 * POST   /api/posts/:postId/comments  — add a comment
 * GET    /api/posts/:postId/comments  — list comments for a post
 * DELETE /api/comments/:id            — delete own comment
 */
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db, authUsersTable, commentsTable, postsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

async function resolveAuthUserId(clerkUserId: string) {
  const authUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.clerkUserId, clerkUserId),
  });
  return authUser ?? null;
}

const commentBodySchema = z.object({
  content: z.string().min(1).max(1000),
});

// ── add comment ────────────────────────────────────────────────────────────

router.post("/posts/:postId/comments", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const parse = commentBodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
  }

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not synced. Call /api/auth/sync first." });

  const post = await db.query.postsTable.findFirst({
    where: eq(postsTable.id, req.params.postId),
  });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const [comment] = await db
    .insert(commentsTable)
    .values({ postId: req.params.postId, userId: authUser.id, content: parse.data.content })
    .returning();

  // bump comment_count on the post
  await db
    .update(postsTable)
    .set({ commentCount: sql`${postsTable.commentCount} + 1` })
    .where(eq(postsTable.id, req.params.postId));

  return res.status(201).json(comment);
});

// ── list comments ──────────────────────────────────────────────────────────

router.get("/posts/:postId/comments", async (req, res) => {
  const comments = await db.query.commentsTable.findMany({
    where: eq(commentsTable.postId, req.params.postId),
    orderBy: [desc(commentsTable.createdAt)],
    limit: 200,
  });

  return res.status(200).json(comments);
});

// ── delete comment ─────────────────────────────────────────────────────────

router.delete("/comments/:id", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not found" });

  const [deleted] = await db
    .delete(commentsTable)
    .where(and(eq(commentsTable.id, req.params.id), eq(commentsTable.userId, authUser.id)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Comment not found or not yours" });

  // decrement comment_count
  await db
    .update(postsTable)
    .set({ commentCount: sql`GREATEST(${postsTable.commentCount} - 1, 0)` })
    .where(eq(postsTable.id, deleted.postId));

  return res.status(200).json({ deleted: true });
});

export default router;
