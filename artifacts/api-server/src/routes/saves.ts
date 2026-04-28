/**
 * Saves routes
 *
 * POST   /api/posts/:postId/saves  — save a post (idempotent)
 * DELETE /api/posts/:postId/saves  — unsave a post
 * GET    /api/saves                — list current user's saved posts
 */
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db, authUsersTable, savesTable, postsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

async function resolveAuthUserId(clerkUserId: string) {
  const authUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.clerkUserId, clerkUserId),
  });
  return authUser ?? null;
}

// ── save a post ────────────────────────────────────────────────────────────

router.post("/posts/:postId/saves", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not synced" });

  const post = await db.query.postsTable.findFirst({
    where: eq(postsTable.id, req.params.postId),
  });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const [save] = await db
    .insert(savesTable)
    .values({ postId: req.params.postId, userId: authUser.id })
    .onConflictDoNothing()
    .returning();

  if (save) {
    await db
      .update(postsTable)
      .set({ saveCount: sql`${postsTable.saveCount} + 1` })
      .where(eq(postsTable.id, req.params.postId));
  }

  return res.status(200).json({ saved: true, saveId: save?.id ?? null });
});

// ── unsave a post ──────────────────────────────────────────────────────────

router.delete("/posts/:postId/saves", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not found" });

  const [deleted] = await db
    .delete(savesTable)
    .where(and(eq(savesTable.postId, req.params.postId), eq(savesTable.userId, authUser.id)))
    .returning();

  if (deleted) {
    await db
      .update(postsTable)
      .set({ saveCount: sql`GREATEST(${postsTable.saveCount} - 1, 0)` })
      .where(eq(postsTable.id, req.params.postId));
  }

  return res.status(200).json({ saved: false });
});

// ── list saved posts for current user ─────────────────────────────────────

router.get("/saves", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await resolveAuthUserId(clerkUserId);
  if (!authUser) return res.status(403).json({ error: "User not found" });

  const saves = await db.query.savesTable.findMany({
    where: eq(savesTable.userId, authUser.id),
    orderBy: [desc(savesTable.createdAt)],
    limit: 200,
  });

  return res.status(200).json(saves);
});

export default router;
