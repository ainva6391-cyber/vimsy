/**
 * Supabase client + Storage helpers for Whimsy.
 *
 * Buckets (both public-read):
 *   • user_post_images    — private/photos/${fileName}
 *   • user_profile_images — profile/${fileName}
 *
 * each bucket have one INSERT policy:
 *   (storage.foldername(name))[1] = 'private'
 *   (storage.foldername(name))[1] = 'profile'
 *
 * Upload strategy: direct REST API calls via fetch.
 * The Supabase JS SDK routes uploads for public buckets to the read-only
 * /object/public/ endpoint in React Native, causing 400 errors. Bypassing the
 * SDK and calling /storage/v1/object/{bucket}/{path} directly with an explicit
 * Authorization header avoids this entirely.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
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
 * Fetch a local URI (file://) and return an ArrayBuffer.
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
 * Get the current session's JWT, throwing a clear error if not signed in.
 */
async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) {
    throw new UploadStorageError(
      "You must be signed in to upload photos. Please sign in and try again.",
    );
  }
  return data.session.access_token;
}

/**
 * Upload to Supabase Storage via direct REST API call.
 *
 * Uses POST /storage/v1/object/{bucket}/{path} — the correct write endpoint —
 * instead of letting the SDK route through /object/public/ which is read-only.
 *
 * @param bucket    Bucket name (e.g. "user_post_images")
 * @param path      Object path within the bucket (must satisfy RLS policy)
 * @param buffer    File bytes
 * @param contentType  MIME type
 * @param upsert    true = overwrite existing file
 */
async function storageUpload(
  bucket: string,
  path: string,
  buffer: ArrayBuffer,
  contentType: string,
  upsert = false,
): Promise<void> {
  const token = await getAccessToken();

  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      "x-upsert": upsert ? "true" : "false",
    },
    body: buffer,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const json = await response.json() as { error?: string; message?: string };
      detail = json.error ?? json.message ?? "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    console.error(`[Supabase] Storage upload failed: ${response.status} — ${detail}`);
    throw new UploadStorageError(
      `Upload failed (${response.status}): ${detail || response.statusText}`,
    );
  }
}

/**
 * Generate a signed URL for reading a storage object.
 *
 * Uses:  POST /storage/v1/object/sign/{bucket}/{path}
 * Returns a URL like:
 *   GET  /storage/v1/object/sign/{bucket}/{path}?token=...
 *
 * No /public/ in either path — matches the POST (upload) endpoint pattern
 * exactly, and works in <Image> components without auth headers because the
 * token is embedded in the query string.
 *
 * @param expiresIn  Seconds until the signed URL expires (default 10 years)
 */
async function signedStorageUrl(
  bucket: string,
  path: string,
  expiresIn = 60 * 60 * 24 * 365 * 10,
): Promise<string> {
  const token = await getAccessToken();

  const url = `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!response.ok) {
    // Non-fatal — fall back to the authenticated read URL which works in the app
    console.warn(`[Supabase] createSignedUrl failed (${response.status}), using direct URL`);
    return `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  }

  const json = await response.json() as { signedURL?: string };
  const signedPath = json.signedURL ?? "";

  // signedURL is a relative path like /storage/v1/object/sign/...?token=...
  // Prepend the Supabase base URL if needed.
  if (signedPath.startsWith("http")) return signedPath;
  return `${supabaseUrl}${signedPath}`;
}

// ── Public types & functions ──────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload an outfit/post image to user_post_images bucket.
 *
 * POST  /storage/v1/object/user_post_images/private/photos/${fileName}
 * GET   /storage/v1/object/sign/user_post_images/private/photos/${fileName}?token=...
 */
export async function uploadPostImage(localUri: string): Promise<UploadResult> {
  const ext = validateExt(localUri);
  const buffer = await uriToArrayBuffer(localUri);
  validateSize(buffer.byteLength);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");
    // add uniqueness (timestamp or random)
  const fileName = `${user.id}-${Date.now()}.${ext}`;
  const path = `private/photos/${fileName}`;
  const contentType = mimeFromExt(ext);

  await storageUpload("user_post_images", path, buffer, contentType, false);

  const url = await signedStorageUrl("user_post_images", path);
  return { publicUrl: url, path };
}


/**
 * Upload a profile avatar to user_profile_images bucket.
 *
 * POST  /storage/v1/object/user_profile_images/profile/${fileName}
 * GET   /storage/v1/object/sign/user_profile_images/profile/${fileNmae}?token=...
 */
export async function uploadProfileImage(localUri: string): Promise<UploadResult> {
  const ext = validateExt(localUri);
  const buffer = await uriToArrayBuffer(localUri);
  validateSize(buffer.byteLength);

  const { 
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");
  
  const fileName = `${user.id}-${Date.now()}.${ext}`;
  const path = `profile/${fileName}`;
  
  const contentType = mimeFromExt(ext);

  await storageUpload("user_profile_images", path, buffer, contentType, true);

  const url = await signedStorageUrl("user_profile_images", path);

  return { publicUrl: url, path };
  }

