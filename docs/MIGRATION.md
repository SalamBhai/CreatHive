# CreatHive — data migration & build plan

This is the working map for moving CreatHive from local mocks to real YPAT data without breaking the MVP UI.

## Guiding principle

The UI never reads storage directly. All reads and writes go through a repository adapter. Today the adapter is backed by `src/lib/sample-data.ts` + `localStorage`; tomorrow it is backed by Supabase. The components stay the same.

## Current state

- `src/lib/store.ts` — TanStack Query hooks over localStorage.
- `src/lib/sample-data.ts` — profiles, pieces, inquiries. New creators: `sheriff`, `amina`, `zainab`, `chidi`, `temi`.
- Mock data is intentionally kept. Real YPAT data will be layered in with an `isYPATData` flag and a `source` marker (`mock` | `ypat` | `campaign`).

## Phase 1 — Studio shell (done)

- Responsive sidebar on desktop, segmented nav + bottom bar on mobile.
- Views: Overview, Pieces, Submissions, Profile, Inquiries, Campaigns.
- Live public preview on wide screens.
- Pieces list, stats, inquiry read view, publish form.

## Phase 2 — Repository seam

Create `src/lib/repository/` with:

```
types.ts        domain interfaces (already in src/lib/types.ts)
local.ts        current localStorage implementation
supabase.ts     Supabase implementation (next)
index.ts        picks implementation via feature flag
```

Store hooks become thin wrappers over the repository. Add `useUpdatePiece` and `useDeletePiece` so "management" is real before DB.

## Phase 3 — Supabase

Tables:

- `profiles` — id, username, display_name, tagline, bio, avatar_url, disciplines[], is_ypat_data, is_available_for_gigs, social_links jsonb, created_at.
- `pieces` — id, creative_id, title, subtitle, discipline, media_type, media_url, text_content, cover_image_url, gallery_urls[], is_featured, applause_count, tags[], source, created_at.
- `inquiries` — id, creative_id, sender_*, event_type, message, status, created_at.
- `campaigns` — id, title, brief, niches[], starts_at, ends_at, status, owner_id, created_at.
- `submissions` — id, campaign_id, creative_id, piece_id, note, status, created_at.
- `applause_events` — for analytics / abuse control.

Policies: creatives manage only their own rows; campaigns and submissions have role-based read/write; admin role for moderation.

## Phase 4 — Cloudinary

- Signed uploads from client; folder `creathive/<username>/<kind>`.
- Store `public_id` + `secure_url` in Supabase only.
- Use transformations for card thumbnails and OG images.

## Phase 5 — Submissions & campaigns

- Public campaign page and submission form, routed by niche.
- Status workflow: `open → reviewing → accepted / rejected`.
- Studio "Submissions" view replaced with a real queue.
- Admin moderation view using the same clean UI as Explore.

## Phase 6 — Admin

- Users / profiles, pieces, campaigns, submissions, inquiries, flags, analytics.
- Same editorial surface language; no separate design system.
- Audit log for destructive actions.

## Phase 7 — Cross-cutting

- Auth + onboarding + username claim + YPAT verification.
- Notifications (in-app + email).
- OG image generation, service worker, observability, backups, rate limits.
- Feature flags for gradual rollout while mocks remain visible.

## Open decisions

- Supabase project name/region and whether auth is email-only or social too.
- Cloudinary cloud name and unsigned preset policy.
- Whether campaign submissions are public by default or require approval.
- Admin roles: single admin vs campaign owners vs moderators.
