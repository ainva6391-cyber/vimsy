/**
 * POST /api/auth/sync
 *
 * Called from the mobile app immediately after a successful Clerk sign-up.
 * Inserts a row into auth_users (sensitive data) and a row into users (profile).
 * Uses ON CONFLICT DO NOTHING so it's safe to call multiple times.
 */
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db, authUsersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const syncBodySchema = z.object({
  clerkUserId: z.string().min(1),
  email:       z.string().email(),
  username:    z.string().min(1).max(50),
  displayName: z.string().max(100).optional(),
  avatarUrl:   z.string().url().optional(),
});

router.post("/auth/sync", requireAuth(), async (req, res) => {
  const parse = syncBodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request body", details: parse.error.flatten() });
  }

  const { clerkUserId, email, username, displayName, avatarUrl } = parse.data;

  // 1️⃣  Upsert into auth_users (sensitive auth data only)
  const [authUser] = await db
    .insert(authUsersTable)
    .values({ clerkUserId, email })
    .onConflictDoUpdate({
      target: authUsersTable.clerkUserId,
      set: { email, updatedAt: new Date() },
    })
    .returning();

  // 2️⃣  Upsert into users (public profile, no email/password)
  const [user] = await db
    .insert(usersTable)
    .values({
      userId:      authUser.id,
      username,
      displayName: displayName ?? username,
      avatarUrl:   avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: usersTable.userId,
      set: {
        username,
        displayName: displayName ?? username,
        avatarUrl:   avatarUrl ?? null,
        updatedAt:   new Date(),
      },
    })
    .returning();

  return res.status(200).json({ authUserId: authUser.id, userId: user.id });
});

/** GET /api/auth/me — resolve Clerk user to internal IDs */
router.get("/auth/me", requireAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthenticated" });

  const authUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.clerkUserId, clerkUserId),
  });

  if (!authUser) return res.status(404).json({ error: "User not synced yet" });

  const profile = await db.query.usersTable.findFirst({
    where: eq(usersTable.userId, authUser.id),
  });

  return res.status(200).json({ authUser, profile });
});

export default router;
