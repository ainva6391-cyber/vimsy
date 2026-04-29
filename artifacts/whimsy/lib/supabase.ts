/**
 * Supabase client + Storage helpers for Whimsy.
 *
 * Buckets (both public):
 *   • user_post_images    — outfit/post photos
 *   • user_profile_images — profile avatars
 *
 * Both buckets have one INSERT policy:
 *   (storage.foldername(name))[1] = 'private'
 * so every path MUST start with  private/
 *
 * Upload strategy: ArrayBuffer (not Blob) — this is the approach that works
 * reliably in React Native / Expo environments.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Error classes ──────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function extFromUri(uri: string): string {
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
 * Fetch a local URI and return an ArrayBuffer.
 * ArrayBuffer is the most reliable upload format in React Native / Expo.
 */
async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new UploadStorageError(
      `Could not read image file (HTTP ${response.status}).`,
    );
  }
  return response.arrayBuffer();
}

/**
 * Validate extension and file size before upload.
 */
function validateExt(uri: string): string {
  const ext = extFromUri(uri);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new UploadValidationError(
      `Unsupported file type ".${ext}". Please use JPG, PNG, or WebP.`,
    );
  }
  return ext;
}

function validateSize(byteLength: number): void {
  if (byteLength > MAX_FILE_SIZE_BYTES) {
    const mb = (byteLength / 1024 / 1024).toFixed(1);
    throw new UploadValidationError(
      `Image is too large (${mb} MB). Maximum allowed is 15 MB.`,
    );
  }
}

/**
 * Build a human-readable message from a Supabase StorageError.
 * Surfaces the real error code/message so issues are diagnosable.
 */
function storageErrorMessage(
  context: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
): string {
  const status: string = err?.statusCode ?? err?.status ?? "";
  const code: string = err?.error ?? "";
  const msg: string = err?.message ?? String(err);
  console.error(`[Supabase] ${context}:`, { status, code, msg, raw: err });
  return `Upload failed (${status || code || "unknown"}): ${msg}`;
}

// ── Public types & functions ──────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Assert that a valid Supabase session exists before attempting storage ops.
 * Surfaces a clear error instead of a confusing 401/403 from storage.
 */
async function requireSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw new UploadStorageError(
      "You must be signed in to upload photos. Please sign in and try again.",
    );
  }
}

/**
 * Upload an outfit/post image to user_post_images bucket.
 * Path: private/photos/<timestamp>_<rand>.<ext>
 */
export async function uploadPostImage(localUri: string): Promise<UploadResult> {
  await requireSession();

  const ext = validateExt(localUri);
  const buffer = await uriToArrayBuffer(localUri);
  validateSize(buffer.byteLength);

  const path = `private/photos/${uniqueFilename(ext)}`;
  const contentType = mimeFromExt(ext);

  const { error } = await supabase.storage
    .from("user_post_images")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw new UploadStorageError(
      storageErrorMessage("Post image upload", error),
    );
  }

  const { data } = supabase.storage.from("user_post_images").getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

/**
 * Upload a profile avatar to user_profile_images bucket.
 * Uses a stable path per user so re-uploading replaces the old avatar.
 *
 * Bucket structure: user_profile_images/private/avatar/{userId}/avatar.{ext}
 * Matches the INSERT policy: (storage.foldername(name))[1] = 'private'
 */
export async function uploadProfileImage(
  localUri: string,
  userId: string,
): Promise<UploadResult> {
  await requireSession();

  const ext = validateExt(localUri);
  const buffer = await uriToArrayBuffer(localUri);
  validateSize(buffer.byteLength);

  // Stable path per user — uploading again replaces the old avatar (upsert: true)
  const path = `private/avatar/${userId}/avatar.${ext}`;
  const contentType = mimeFromExt(ext);

  const { error } = await supabase.storage
    .from("user_profile_images")
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    throw new UploadStorageError(
      storageErrorMessage("Profile image upload", error),
    );
  }

  const { data } = supabase.storage
    .from("user_profile_images")
    .getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
