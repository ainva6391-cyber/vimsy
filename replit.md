# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Whimsy (Mobile App)
- **Type**: Expo (React Native)
- **Path**: `artifacts/whimsy/`
- **Preview**: `/` (root)
- **Purpose**: Fashion and outfit style sharing platform — image-only social media

#### Features
- Masonry grid discover feed with style category filters
- Search by style, tags, captions, usernames
- Upload/share outfit photos from device gallery
- Save posts to collections/boards with board create flow
- Post detail view with tag display, save counts, board saving modal
- Board detail view with post grid and delete board action
- User profile with Clerk user data (avatar, display name, email)
- Sign out from profile screen
- Sign In / Sign Up screens for unauthenticated users
- Dark mode support
- AsyncStorage for local persistence

#### Auth System (Clerk)
- Provider: Replit-managed Clerk (`@clerk/expo`)
- Auth routes: `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`
- Auth group layout: `app/(auth)/_layout.tsx` — redirects signed-in users to tabs
- Email + password flow with email verification code
- Discover tab is public (visible without auth)
- Profile tab shows sign-in / sign-up prompt for unauthenticated users
- Clerk keys forwarded via `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` env var in dev and build scripts
- API server wired with Clerk proxy middleware (`/__clerk`) and `clerkMiddleware()`
- Metro `blockList` excludes `@wallet-standard` temp dirs (Clerk's Solana peer dep)

#### Key Files
- `app/_layout.tsx` — Root layout with ClerkProvider + ClerkLoaded wrapping all providers
- `app/(tabs)/_layout.tsx` — 5-tab navigation (Discover, Explore, Share, Collections, Profile)
- `app/(auth)/_layout.tsx` — Auth group; redirects signed-in users
- `app/(auth)/sign-in.tsx` — Sign in screen (email/password + MFA verify)
- `app/(auth)/sign-up.tsx` — Sign up screen (email/password + email code verify)
- `contexts/AppContext.tsx` — Global state: posts, boards, current user, save/add/create actions
- `constants/colors.ts` — Design tokens (blush rose / lavender theme)
- `components/MasonryGrid.tsx` — Reusable 2-column masonry image grid
- `components/SaveButton.tsx` — Animated save/bookmark button (Ionicons filled/outline)
- `components/StyleTag.tsx` — Pill-style style category tag
- `components/BoardCard.tsx` — Collection board card (navigates to board/[id])
- `components/UserAvatar.tsx` — Circular user avatar
- `metro.config.js` — Extends default config with wallet-standard blockList

#### Dependencies Added
- `@clerk/expo` — Expo Clerk auth SDK
- `@clerk/express` — Server-side Clerk middleware
- `expo-auth-session` — OAuth session handling
- `expo-secure-store` — Secure token storage for Clerk
- `expo-crypto` — Crypto primitives for Clerk
- `expo-web-browser` — OAuth browser flow
- `@react-native-async-storage/async-storage` — local persistence
- `expo-image-picker` — device photo access
- `expo-image` — optimized image component
- `http-proxy-middleware` — Clerk proxy on API server
