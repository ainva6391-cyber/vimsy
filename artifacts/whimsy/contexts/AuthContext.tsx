import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

import { syncUser } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    meta: { name: string; username: string },
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        await trySyncUser(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error.message) };
    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    { name, username }: { name: string; username: string },
  ): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username, display_name: name, avatar_url: null },
      },
    });

    if (error) return { error: friendlyAuthError(error.message), needsEmailConfirmation: false };

    // If Supabase returned a session directly (email confirmation disabled) we're done.
    if (data.session) return { error: null, needsEmailConfirmation: false };

    // Email confirmation is still enabled in the Supabase project settings.
    // Try signing in immediately — this succeeds only if the project has
    // confirmation disabled but the signUp call happened to return null session
    // for another reason (rare). If it fails with "not confirmed", surface the
    // confirmation screen so the user knows what to do.
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInErr) return { error: null, needsEmailConfirmation: false };

    // "Email not confirmed" means Supabase still requires confirmation.
    if (signInErr.message.toLowerCase().includes("not confirmed") ||
        signInErr.message.toLowerCase().includes("email")) {
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: friendlyAuthError(signInErr.message), needsEmailConfirmation: false };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function refreshUser(): Promise<void> {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) setSession(data.session);
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function trySyncUser(session: Session) {
  try {
    const { user } = session;
    const meta = user.user_metadata ?? {};
    const email = user.email ?? "";
    const username = (meta.username as string) || email.split("@")[0];
    const name = (meta.name as string) || username;
    const avatarUrl = (meta.avatar_url as string) || undefined;

    await syncUser(
      {
        supabaseUserId: user.id,
        email,
        username,
        displayName: name,
        avatarUrl,
      },
      session.access_token,
    );
  } catch (err) {
    console.warn("[Auth] DB sync failed (non-critical):", err);
  }
}

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("wrong password")) {
    return "Incorrect email or password.";
  }
  if (m.includes("already registered") || m.includes("already exists") || m.includes("email already")) {
    return "An account with this email already exists.";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "Password must be at least 6 characters.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Network error. Please check your connection.";
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return msg;
}
