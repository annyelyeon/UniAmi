# UniAmi
NIT3274 Small IT Business Assigment

## Scaffold Overview

Recommended stack for the MVP: Expo + React Native + TypeScript + Expo Router, with Supabase as the backend once feature work starts. That combination keeps the app fast to build for a small student team, supports a clean tabbed mobile structure, and fits UniAmi's trust-heavy model with auth, database, and file storage in one place.

Supabase setup in this scaffold:

- Env vars live in `.env.example` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- The client is in `src/lib/supabase.ts`.
- The profiles table and new-user trigger are defined in `supabase/migrations/001_profiles.sql`.

The current scaffold includes:

- A 5-tab navigation shell for Home, Community, Subject Info, Personal, and Profile.
- Minimal placeholder screens only, with an orange-accented, card-based visual system.
- Typed data model stubs for users, boards, posts, comments, subject reviews, sticker packs, job listings, and direct messages.

## Folder Structure

```text
app/
	(tabs)/
		_layout.tsx
		home.tsx
		community.tsx
		subject-info.tsx
		personal.tsx
		profile.tsx
	_layout.tsx
	index.tsx
src/
	components/
	theme/
	types/
```

## Next Step

Home is the first tab to flesh out. The navigation shell is already in place, so the next prompt can focus just on the Home hub cards and their interactions.
