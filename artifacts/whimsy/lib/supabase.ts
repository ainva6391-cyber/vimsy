/**
 * Supabase Storage client for Whimsy.
 * Used exclusively for image uploads — no auth, no DB tables.
 *
 * Buckets (both public):
 *   • user_post_images    — outfit/post photos
 *   • user_profile_images — profile avatars
 */
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function uniqueFilename(ext = "jpg") {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${ts}_${rand}.${ext}`;
}

function extFromUri(uri: string): string {
  const match = uri.match(/\.(\w+)(\?|$)/);
  if (match) return match[1].toLowerCase();
  return "jpg";
}

/**
 * Convert a local URI (file:// or blob: or data:) to a Blob.
 * Works on both web and React Native.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

// ── Public upload functions ───────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload an outfit/post image.
 * @param localUri  The URI returned by expo-image-picker
 * @returns         Public URL and storage path
 */
export async function uploadPostImage(localUri: string): Promise<UploadResult> {
  const ext = extFromUri(localUri);
  const path = `posts/${uniqueFilename(ext)}`;
  const blob = await uriToBlob(localUri);

  const { error } = await supabase.storage
    .from("user_post_images")
    .upload(path, blob, {
      contentType: blob.type || `image/${ext}`,
      upsert: false,
    });

  if (error) throw new Error(`Post image upload failed: ${error.message}`);

  const { data } = supabase.storage.from("user_post_images").getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

/**
 * Upload a profile avatar image.
 * @param localUri  The URI returned by expo-image-picker
 * @param userId    Used as a sub-folder to avoid collisions
 * @returns         Public URL and storage path
 */
export async function uploadProfileImage(
  localUri: string,
  userId: string,
): Promise<UploadResult> {
  const ext = extFromUri(localUri);
  const path = `avatars/${userId}/${uniqueFilename(ext)}`;
  const blob = await uriToBlob(localUri);

  const { error } = await supabase.storage
    .from("user_profile_images")
    .upload(path, blob, {
      contentType: blob.type || `image/${ext}`,
      upsert: true, // overwrite previous avatar for same user
    });

  if (error) throw new Error(`Profile image upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from("user_profile_images")
    .getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
