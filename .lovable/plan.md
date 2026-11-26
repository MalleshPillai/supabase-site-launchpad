# The Little Things — implementation plan

Build the private two-person scrapbook described in the uploaded brief, using the connected Supabase project and the existing TanStack Start app.

## Build
1. Replace the blank home page with an authenticated application shell and an inviting scrapbook dashboard. Create real pages for Home, Memories, Brownie Bank, Reward Shop, Love Letters, Timeline, Happiness Jar, Bucket List, Little Games, Achievements, Notifications, and Settings; make desktop and mobile navigation usable.
2. Add the Supabase schema and secure access rules for profiles, memories/albums/favourites/tags, brownie ledger and balances, rewards/redemptions, letters, timeline, happiness notes, bucket list, games, achievements, notifications, daily surprises, memory capsules, and activity history. Use private storage buckets for the requested media. Restrict membership to Mallesh and Darshu; hold the final account allowlist until their account emails or IDs are confirmed.
3. Implement real authenticated workflows: photo uploads and gallery management; atomic, idempotent brownie awards; reward requests and acceptance/decline with points deducted only once after acceptance; recipient-only and time-locked letters/capsules; timeline, notes, bucket list, games, achievements, notifications, profile/settings, and password reset. Never expose private content, account secrets, or service credentials.
4. Add loading, empty, validation, success, and failure states throughout. Keep the ivory/blush vintage scrapbook styling from the brief, with clear touch-friendly mobile navigation and accessible controls.
5. Add tests for consequential authorization and transaction rules, run focused tests, verify the app’s principal flows in the preview, inspect build/runtime signals, and review the final task list.

## Technical approach
- Preserve TanStack Start routing and the connected Supabase integration; no React Router or alternate backend.
- Use migrations for database changes, explicit grants, RLS on private tables, and narrowly scoped Storage policies. Use PostgreSQL RPCs for sensitive atomic transactions; use TanStack server functions for app-internal server work.
- Use existing Supabase Auth accounts only; do not add public registration. Verify users on the server and derive identity from the validated session, never from client-supplied IDs.
- Build in focused increments so backend security and core flows are established before secondary features. Do not claim account lock-down or live workflows are verified until the required account mapping and preview checks are complete.
