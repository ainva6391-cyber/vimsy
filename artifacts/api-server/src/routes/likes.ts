/**
 * Likes routes
 *
 * POST   /api/posts/:postId/likes  — like a post (idempotent)
 * DELETE /api/posts/:postId/likes  — unlike a post
 */
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db, authUsersTable, likesTable, postsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

async function resolveAuthUserId(clerkUserId: string) {
  const authUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.clerkUserId, clerkUserId),
  });
  return authUser ?? null;
}

// ── like ───────────────────────────────────────────────────────────────────

router.post("/posts/:postId/likes", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not synced" });

  const post = await db.query.postsTable.findFirst({
    where: eq(postsTable.id, req.params.postId),
  });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const [like] = await db
    .insert(likesTable)
    .values({ postId: req.params.postId, userId: authUser.id })
    .onConflictDoNothing()
    .returning();

  if (like) {
    await db
      .update(postsTable)
      .set({ likeCount: sql`${postsTable.likeCount} + 1` })
      .where(eq(postsTable.id, req.params.postId));
  }

  return res.status(200).json({ liked: true, likeId: like?.id ?? null });
});

// ── unlike ─────────────────────────────────────────────────────────────────

router.delete("/posts/:postId/likes", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not found" });

  const [deleted] = await db
    .delete(likesTable)
    .where(and(eq(likesTable.postId, req.params.postId), eq(likesTable.userId, authUser.id)))
    .returning();

  if (deleted) {
    await db
      .update(postsTable)
      .set({ likeCount: sql`GREATEST(${postsTable.likeCount} - 1, 0)` })
      .where(eq(postsTable.id, req.params.postId));
  }

  return res.status(200).json({ liked: false });
});

export default router;
