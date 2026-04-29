/**
 * Supabase Auth Middleware
 *
 * Verifies a Supabase JWT from the Authorization: Bearer header.
 * Attaches req.supabaseUserId (the Supabase auth user UUID) on success.
 * Returns 401 if the token is missing or invalid.
 */
import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      supabaseUserId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.supabaseUserId = data.user.id;
  return next();
}
