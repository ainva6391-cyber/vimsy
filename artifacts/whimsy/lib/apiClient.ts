/**
 * Typed API client for the Whimsy backend.
 * All functions are plain async functions — pass a Clerk token for protected routes.
 */
import { Platform } from "react-native";

function baseUrl() {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "/api";
}

async function apiFetch<T = unknown>(
  path: string,
  method: "GET" | "POST" | "DELETE" | "PATCH",
  body?: object,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function syncUser(
  payload: { supabaseUserId: string; email: string; username: string; displayName?: string; avatarUrl?: string },
  token: string,
) {
  return apiFetch("/auth/sync", "POST", payload, token);
}

// ── Posts ───────────────────────────────────────────────────────────────────

export interface ApiPost {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  style: string | null;
  tags: string[] | null;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  createdAt: string;
}

export function createPost(
  payload: { imageUrl: string; caption?: string; style?: string; tags?: string[] },
  token: string,
) {
  return apiFetch<ApiPost>("/posts", "POST", payload, token);
}

// ── Likes ───────────────────────────────────────────────────────────────────

export function likePost(postId: string, token: string) {
  return apiFetch(`/posts/${postId}/likes`, "POST", undefined, token);
}

export function unlikePost(postId: string, token: string) {
  return apiFetch(`/posts/${postId}/likes`, "DELETE", undefined, token);
}

// ── Comments ─────────────────────────────────────────────────────────────────

export interface ApiComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export function addComment(postId: string, content: string, token: string) {
  return apiFetch<ApiComment>(`/posts/${postId}/comments`, "POST", { content }, token);
}

export function listComments(postId: string) {
  return apiFetch<ApiComment[]>(`/posts/${postId}/comments`, "GET");
}

// ── Saves ────────────────────────────────────────────────────────────────────

export function savePost(postId: string, token: string) {
  return apiFetch(`/posts/${postId}/saves`, "POST", undefined, token);
}

export function unsavePost(postId: string, token: string) {
  return apiFetch(`/posts/${postId}/saves`, "DELETE", undefined, token);
}

export function deletePost(postId: string, token: string) {
  return apiFetch(`/posts/${postId}`, "DELETE", undefined, token);
}
