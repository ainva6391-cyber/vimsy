# Threat Model

## Project Overview

Whimsy is a fashion photo sharing application with an Expo/React Native client in `artifacts/whimsy/`, an Express 5 API in `artifacts/api-server/`, PostgreSQL via Drizzle in `lib/db/`, and Supabase for authentication and object storage. Users can sign up with email/password, upload post images and profile avatars, and interact with public posts through likes, saves, and comments.

Production-relevant code is the Expo client, the API server, and shared database schema. `artifacts/mockup-sandbox/` is a development-only sandbox and should be ignored unless separate evidence shows it is reachable in production. Assume `NODE_ENV=production` in production and platform TLS termination is present.

## Assets

- **User accounts and sessions** — Supabase identities, bearer tokens, and mapped local `auth_users` / `users` records. Compromise enables impersonation and unauthorized changes.
- **User profile data** — usernames, display names, avatars, bios, and style tags. This data is user-controlled but must still be protected from unauthorized tampering.
- **User-uploaded media** — post images and profile photos stored in Supabase Storage. Even when intended for sharing, object ownership and write permissions must remain scoped to the correct user.
- **Social graph and activity data** — posts, likes, saves, and comments. Integrity matters because users should only be able to create or remove their own actions.
- **Application secrets and backend connectivity** — Supabase service configuration, database credentials, and API environment variables.

## Trust Boundaries

- **Client to API** — the Expo app is untrusted. Every protected API route must authenticate the bearer token and derive acting identity server-side.
- **API to PostgreSQL** — the API has direct write access to core data tables. Any broken authorization or input trust at this layer can directly alter production data.
- **Client to Supabase Auth** — sign-in and session refresh happen against Supabase. The app must not trust mutable client metadata more than token-derived identity.
- **Client to Supabase Storage** — uploads happen directly from the app to storage using the user's bearer token. Storage paths and bucket policies form a separate authorization boundary from the API.
- **Public to authenticated surfaces** — feed and post reads are public; sync, create, delete, like, save, and comment writes are authenticated. That separation must be enforced on the server and in storage policy.

## Scan Anchors

- Production API entry points: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`
- Authentication enforcement: `artifacts/api-server/src/middlewares/supabaseAuthMiddleware.ts`, `artifacts/whimsy/contexts/AuthContext.tsx`
- Upload surfaces: `artifacts/whimsy/lib/supabase.ts`, `artifacts/whimsy/app/(tabs)/upload.tsx`, `artifacts/whimsy/app/(tabs)/profile.tsx`
- Persistence and ownership mapping: `lib/db/src/schema/*.ts`, especially `auth-users.ts`, `users.ts`, and `posts.ts`
- Dev-only area to skip unless proven reachable: `artifacts/mockup-sandbox/`

## Threat Categories

### Spoofing

The API uses Supabase bearer tokens, so protected routes must bind all identity-sensitive actions to `req.supabaseUserId` derived from token verification rather than trusting request bodies or mutable client metadata. Any route that accepts a user identifier, email, or profile identity field from the client must verify it matches the authenticated Supabase user.

### Tampering

Users can upload photos, create posts, and update profile state. The system must ensure a user can only modify their own database records and their own storage objects. Storage paths and bucket policies must enforce per-user isolation rather than shared writable paths, and the API must not accept client-supplied media references as proof of upload ownership.

### Information Disclosure

Post content is public by design, but authentication data, private storage objects, and any non-public profile state must not be exposed through API responses, logs, or overly broad signed URLs. The server must avoid returning more identity data than callers need, and storage access must not turn nominally private objects into globally readable resources without intent.

### Denial of Service

Public and authenticated write endpoints can be abused to create excessive rows or oversized uploads. Upload size limits and bounded list sizes help, but production protections should also prevent repeated expensive writes or storage abuse from authenticated users.

### Elevation of Privilege

The highest-risk paths are identity sync and direct storage upload. The system must prevent an authenticated user from claiming another user's local account mapping, exhausting shared storage namespaces, publishing media they do not control, or otherwise crossing user boundaries through predictable identifiers or insufficient ownership checks.
