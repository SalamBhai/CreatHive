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

## Phase 5 — Submissions & campaigns (ADMIN ONLY)

Important product decision: **campaigns and the submissions review queue belong to the admin surface only**, never to an individual creator's Studio navigation.

- Admin creates campaigns (brief, niches, dates) from the admin page.
- Individual creatives submit through the existing **Add New Piece** button in their Studio, where a submission can be assigned to an open campaign — they do not get their own Submissions or Campaigns tabs.
- The individual Studio bottom tab bar is therefore only: Overview · Pieces · Inquiries · Profile.
- Status workflow: `open → reviewing → accepted / rejected`, managed from admin.
- Admin moderation view uses the same clean UI language as Explore.

### Data boundary: creator vs admin

- **Creator-scoped:** pieces, inquiries (real "Book a Gig" requests), applause — always filtered by the creator's `profile.id`.
- **Admin-scoped:** join/signup requests (stored separately in `creathive_join_requests_v1`), campaigns, submissions queue, moderation, platform metrics.
- Never write onboarding/signup records into the creator inquiry store. `useInquiries(creativeId)` scopes by owner; admins have no inquiry view (migration `012` drops the old read policy). Legacy join requests were removed from the app entirely.

## Phase 6 — Admin

- Users / profiles, pieces, campaigns, submissions, inquiries, flags, analytics.
- Same editorial surface language; no separate design system.
- Audit log for destructive actions.

## Phase 7 — Cross-cutting

- Auth + onboarding + username claim + YPAT verification.
- Notifications: Web Push over VAPID is wired for inquiries/submissions (`009_push_subscriptions.sql`); in-app and email digests are still pending.
- OG image generation, service worker, observability, backups, rate limits.
- Feature flags for gradual rollout while mocks remain visible.

## Open decisions

- Supabase project name/region and whether auth is email-only or social too.
- Cloudinary cloud name and unsigned preset policy.
- Whether campaign submissions are public by default or require approval.
- Admin roles: single admin vs campaign owners vs moderators.
