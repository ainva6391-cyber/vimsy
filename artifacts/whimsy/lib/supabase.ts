/**
 * Supabase Storage client for Whimsy.
 * Used exclusively for image uploads — no auth, no DB tables.
 *
 * Buckets (both public):
 *   • user_post_images    — outfit/post photos
 *   • user_profile_images — profile avatars
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Validation ────────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export class UploadStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadStorageError";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extFromUri(uri: string): string {
  // Strip query string then grab extension
  const clean = uri.split("?")[0];
  const match = clean.match(/\.(\w+)$/);
  if (match) return match[1].toLowerCase();
  return "jpg";
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return map[ext] ?? "image/jpeg";
}

function uniqueFilename(ext = "jpg") {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${ts}_${rand}.${ext}`;
}

/**
 * Convert a local URI (file:// or blob: or data:) to a Blob.
 * Works on both web and React Native (via Expo's fetch polyfill).
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new UploadStorageError(`Could not read image file (status ${response.status}).`);
  }
  return response.blob();
}

/**
 * Validate extension and file size before upload.
 * Throws UploadValidationError with a user-friendly message on failure.
 */
async function validateImage(uri: string, blob: Blob): Promise<void> {
  const ext = extFromUri(uri);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new UploadValidationError(
      `Unsupported file type ".${ext}". Please use JPG, PNG, or WebP.`,
    );
  }
  if (blob.size > MAX_FILE_SIZE_BYTES) {
    const mb = (blob.size / 1024 / 1024).toFixed(1);
    throw new UploadValidationError(
      `Image is too large (${mb} MB). Maximum allowed size is 15 MB.`,
    );
  }
}

// ── Public types & functions ──────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload an outfit/post image to user_post_images bucket.
 *
 * @param localUri  URI returned by expo-image-picker
 * @throws UploadValidationError for invalid type / size
 * @throws UploadStorageError    for Supabase / network failures
 */
export async function uploadPostImage(localUri: string): Promise<UploadResult> {
  const blob = await uriToBlob(localUri);
  await validateImage(localUri, blob);

  const ext = extFromUri(localUri);
  // Path must start with "private/" to satisfy the Supabase INSERT policy
  const path = `private/photos/${uniqueFilename(ext)}`;
  const contentType = blob.type && blob.type !== "application/octet-stream"
    ? blob.type
    : mimeFromExt(ext);

  const { error } = await supabase.storage
    .from("user_post_images")
    .upload(path, blob, { contentType, upsert: false });

  if (error) {
    console.error("[Supabase] Post image upload error:", error);
    throw new UploadStorageError(
      error.message.includes("policy")
        ? "Storage permission denied. Please contact support."
        : `Upload failed: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from("user_post_images").getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

/**
 * Upload a profile avatar image to user_profile_images bucket.
 * Uses a stable path per user so the avatar can be replaced (upsert: true).
 *
 * @param localUri  URI returned by expo-image-picker
 * @param userId    Supabase user ID used as sub-folder
 * @throws UploadValidationError for invalid type / size
 * @throws UploadStorageError    for Supabase / network failures
 */
export async function uploadProfileImage(
  localUri: string,
  userId: string,
): Promise<UploadResult> {
  const blob = await uriToBlob(localUri);
  await validateImage(localUri, blob);

  const ext = extFromUri(localUri);
  // Path must start with "private/" to satisfy the Supabase INSERT policy.
  // Using a fixed filename per user so re-uploading overwrites the old avatar.
  const path = `private/avatars/${userId}/avatar.${ext}`;
  const contentType = blob.type && blob.type !== "application/octet-stream"
    ? blob.type
    : mimeFromExt(ext);

  const { error } = await supabase.storage
    .from("user_profile_images")
    .upload(path, blob, { contentType, upsert: true });

  if (error) {
    console.error("[Supabase] Profile image upload error:", error);
    throw new UploadStorageError(
      error.message.includes("policy")
        ? "Storage permission denied. Please contact support."
        : `Upload failed: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from("user_profile_images").getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
