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
- Save posts to collections/boards
- Post detail view with tag display, save counts, board saving
- User profile with stats (looks, followers, following)
- Dark mode support
- AsyncStorage for local persistence

#### Key Files
- `app/_layout.tsx` — Root layout with providers (AppProvider, QueryClient, etc.)
- `app/(tabs)/_layout.tsx` — 5-tab navigation (Discover, Explore, Share, Collections, Profile)
- `contexts/AppContext.tsx` — Global state: posts, boards, current user, save/add/create actions
- `constants/colors.ts` — Design tokens (blush rose / lavender theme)
- `components/MasonryGrid.tsx` — Reusable 2-column masonry image grid
- `components/SaveButton.tsx` — Animated save/bookmark button
- `components/StyleTag.tsx` — Pill-style style category tag
- `components/BoardCard.tsx` — Collection board card
- `components/UserAvatar.tsx` — Circular user avatar

#### Dependencies Added
- `@react-native-async-storage/async-storage` — local persistence
- `expo-image-picker` — device photo access
- `expo-image` — optimized image component
