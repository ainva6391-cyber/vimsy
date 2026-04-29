/**
 * POST /api/auth/sync
 *
 * Called from the mobile app after a successful Supabase sign-in/sign-up.
 * Inserts a row into auth_users and a row into users (profile).
 * Uses ON CONFLICT DO UPDATE so it is safe to call multiple times.
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/supabaseAuthMiddleware";
import { db, authUsersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const syncBodySchema = z.object({
  supabaseUserId: z.string().min(1),
  email:          z.string().email(),
  username:       z.string().min(1).max(50),
  displayName:    z.string().max(100).optional(),
  avatarUrl:      z.string().url().optional(),
});

router.post("/auth/sync", requireAuth, async (req, res) => {
  const parse = syncBodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request body", details: parse.error.flatten() });
  }

  const { supabaseUserId, email, username, displayName, avatarUrl } = parse.data;

  // Upsert into auth_users
  const [authUser] = await db
    .insert(authUsersTable)
    .values({ supabaseUserId, email })
    .onConflictDoUpdate({
      target: authUsersTable.supabaseUserId,
      set: { email, updatedAt: new Date() },
    })
    .returning();

  // Upsert into users (public profile)
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

router.get("/auth/me", requireAuth, async (req, res) => {
  const supabaseUserId = req.supabaseUserId!;

  const authUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.supabaseUserId, supabaseUserId),
  });

  if (!authUser) return res.status(404).json({ error: "User not synced yet" });

  const profile = await db.query.usersTable.findFirst({
    where: eq(usersTable.userId, authUser.id),
  });

  return res.status(200).json({ authUser, profile });
});

export default router;
