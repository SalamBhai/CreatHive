# CreatHive — state & next picks

_As of 2026-11-18. **Working tree is dirty** — the items marked "just fixed" below are uncommitted on `main`; everything earlier is pushed._

## ✅ Done

### Brand & design language
- Playball wordmark (open `C` — no longer reads as `G`), two-tone `Creat` / `Hive`.
- Spoken name (`“Creative”`) in metadata, OG, manifest, JSON-LD, aria labels, hover title.
- Clean editorial UI: paper canvas, hairline borders, soft shadows. Neobrutalism reserved for primary actions only.
- Shared primitives: `Surface`, `FilterTabs`.

### Landing `/`
- Visual-first: six full-bleed photographic splash panels, locally hosted from Unsplash (`public/images/scenes/` + `CREDITS.md`).
- Text reduced to short, punchy lines derived from the original copy.
- No indices, no "Explore @sheriff". Primary CTA: **Explore Arts → `/explore`**.
- Mobile: horizontal swipe/snap deck with page dots. Desktop: vertical scrollytelling with progress bar.

### Explore `/explore`
- Substack/Medium-style discovery feed across 5 creators and 11 pieces.
- **Niches** filter (All · Spoken Word · Poetry · Dance · Music · Tech Imagery · UI/UX · Brand & Visuals · Motion).
- Image-led cards; card/avatar/name link to the creator's profile.
- Creator avatar row at top (it is **all** creators, not an `isFeatured` subset).

### Public profile `/[username]`
- Route is `/sheriff` (not `/@sheriff`); the page also tolerates a leading `@`.
- Cleaned hero, softened cards, filter tabs.
- Action dock: single-line **Book a Gig** + icon-only Share. Owner-only Studio link removed.
- One floating "Get your own CreatHive" pill at the end.
- Context-note labels ("Recorded in Lagos…", "Published in the 2026 Anthologies…") removed everywhere.
- Poetry badge no longer collides with text.
- Media: audio player, video (native + allowlisted YouTube/Vimeo embeds), gallery with thumbnails, poetry reader.
- Tags: user-defined, lowercase, deduped, capped at 8, with suggestions from existing work.
- Work links: "Work link" field with allowlist note; niche drives media format automatically.

### Studio `/studio` (individual creator)
- Responsive shell: desktop sidebar + live preview; mobile bottom tab bar (Overview · Pieces · Inquiries · Profile).
- No more top scroll-nav, no sideways overflow.
- Overview: quiet summary with "Edit profile & socials" link; no "Next actions".
- Pieces: stacked mobile cards (cover banner, 2-line title, "Open post ↗") / compact desktop rows.
- Profile: editable details, socials, gigs toggle, avatar URL **or upload**, Save — with a live preview. Mobile uses **Edit / Preview** tabs.
- Inquiries: read view from local store, with `PENDING → REVIEWED → RESPONDED` actions.
- Add Piece: tabbed on mobile (**Details / Media / Story**), stacked on desktop; sticky Publish button.
- Full-post composer: single WYSIWYG canvas with a `+` insert menu (text, heading, quote, image, photo grid, video/audio, embed, divider). PDFs are managed as a separate attachment, not an inline link.
- Full-post view `/p/[id]` for all niches — includes image grid, media, sanitized body HTML, PDF source document with page-image reader, tags.
- Admin-only items (Campaigns, Submissions) removed from creator nav — decision recorded in `docs/MIGRATION.md`.

### Plumbing
- `useAllPieces`, `useInquiries`, `useUpdateProfile`, plus `usePiece` (single piece by id, any visibility).
- `src/lib/media.ts` (URL → safe embed), `media-format.ts` (niche → format), `tags.ts` (normalisation).
- `src/lib/repository/` seam — UI calls `repository`, with `local` and `supabase` adapters; `NEXT_PUBLIC_DATA_SOURCE` switches them (default `local`).
- `docs/MIGRATION.md` — phased Supabase/Cloudinary/admin plan.
- Build, typecheck and lint green.

---

## 🔧 Just fixed (uncommitted — 2026-11-18)

These were either falsified as "done" in the previous version of this file, or were half-built untracked work.

### Correctness
- **Signup route** — `/api/auth/signup` called a `'use client'` export from the server and returned **500 on every signup**. Auth now lives in `src/lib/server-auth.ts` + `src/lib/supabase-server.ts` (server-safe), with real validation, handle-uniqueness check, friendly errors, no raw stack traces.
- **Check-email state** — `/join` used to assume autoconfirm and dump the user at an auth gate. It now handles `confirmation_sent` (202) with a real "check your inbox" screen, then signs in on the client to establish a browser session and provision the profile.
- **Unlisted / draft direct links** — `listPieces()` only returns `PUBLIC`, so `/p/[id]` could not open unlisted pieces. Added `getPiece(id)` to the repository + `usePiece()`; `PostView` uses it while keeping the public feed for prev/next.
- **`/p/[id]` metadata** — `generateMetadata` now reads live Supabase rows (UUID-guarded) with a mock fallback, instead of only `INITIAL_PIECES`.
- **Supabase flag handling** — `fromProfile()` wrote `is_ypat_data: false` for real signups and reads ignored the stored flag. The flag and `source` now round-trip correctly.
- **UUID guard** — `reorderPieces()` no longer sends mock ids to a `uuid` column.
- **Mock/real replacement strategy (agreed 2026-11-18)** — mocks stay code-side and remain visible in Explore. A real profile replaces its mock by **handle**; a creator's mock pieces are now retired **all at once** once they publish their first real piece (`listPieces()` resolves real owners → handles via one profiles query and drops those handles' mocks). Other creators' mocks stay until they publish.
- **One source of truth** — `useDataSource()` no longer filters data; `filterProfiles`/`hasRealProfile`/`filterPieces` were dead or duplicated repository logic and are removed. Studio now trusts `useCreativePieces()` and uses its own profile directly.
- **Flag read** — all Supabase rows are treated as real (`isYPATData: true, source: 'live'`) on read, so old rows written with the hardcoded `false` flag are not misclassified. `fromProfile()` still writes the correct flag going forward; migration `002_backfill_is_ypat_data.sql` fixes the stored column.
- **Welcome email** — SMTP env vars documented in `.env.example`; `@types/nodemailer` installed; no-op string replace removed. Email is still **off** until SMTP vars are set.

### Claims that are now literally true
- Mobile up/down reorder controls are visible (they were `hidden md:flex`).
- All avatar/gallery/reel images use `next/image` (user-supplied URLs use `unoptimized`).
- No manual `useMemo` / `useCallback` remain; React Compiler is the only memoisation.
- `generateMetadata` exists for `/explore` and `/join` (were static `metadata` exports).

### Cloudinary (hardened, still uncommitted)
- Signed upload route now requires a Supabase session in live mode, forwards the bearer token from the browser client (`src/lib/upload.ts`), throttles per user/IP, validates MIME + size, detects `image` / `video` (audio included) / `raw` (PDF) resource types, guards missing env vars, and uses `creathive/<username>/<kind>` folders.
- `publicId` is now stored: `avatar_public_id`, `media_public_id`, `cover_public_id`, `gallery_public_ids` added to types, both adapters, `schema.sql`, and migration `supabase/migrations/001_upload_public_ids.sql`.
- Avatar upload UI rewritten: working button, React state, real error handling, URL field, live preview, and the value is saved. (Banner upload still absent.)
- **Not end-to-end tested against live Cloudinary/Supabase** — typecheck, lint, build and the signup 400 paths were verified.

---

## 🔲 Next picks

### Medium — Studio / UX
- [x] Banner upload UI — URL field + upload in `ProfileEditor`, image shown in `ProfileHero` with the gradient as fallback. Needs migration `003_banner_upload.sql` on the live DB.
- [x] Full-post composer — `+` image/grid can upload files (URLs still accepted), captions, left/centre/right alignment, and optional video poster URL.
- [x] One WYSIWYG text field across all niches; plain-text excerpts and audio scripts derived from it. PDF attached as a source document with uploaded page images, selectable cover page and mobile page reader (migration `014`).
- [x] `/admin` built: overview metrics, creators, pieces, campaigns, submissions, flags and audit log behind an admin gate. Inquiries are creator-only; no admin view. Needs migration `004` and `is_admin = true` on your profile.

### Large — data & platform (see `docs/MIGRATION.md`)
- [~] Supabase project: `profiles`, `pieces`, `inquiries`, `join_requests`, `campaigns`, `submissions`, `flags`, `audit_log` + RLS and `is_admin()` helper (schema.sql / migration 004). `applause_events` still not modelled.
- [ ] Sup Auth + onboarding: YPAT verification, username claim UX, email verification polish. (Signup, session, profile provisioning and check-email state are done.)
- [ ] Cloudinary: transformations, replace/delete using stored `public_id`, cleanup jobs. (Signed uploads, folders, validation and public_id storage are done.)
- [~] Migrations `001`–`012` exist; `ALL_MIGRATIONS.sql` applies them in order (includes inquiry attachments and creator-only inquiry RLS).
- [ ] Migrate mocks as seed data; keep them visible alongside real YPAT users.
- [x] Admin page (clean, like Explore): creators, pieces, campaigns, submissions, flags, audit log, metrics, gated by `is_admin`. Inquiries stay private to their creative.
- [x] Admin creates campaigns; creators submit through **Add New Piece** with campaign assignment.
- [~] Submission workflow `OPEN → REVIEWING → ACCEPTED / REJECTED` in admin UI. Web Push (free VAPID) done for new inquiries, new submissions and submission decisions; in-app/email digests still pending.
- [ ] Analytics: profile views, applause, campaign conversion; audit log for admin actions.
- [x] PWA completeness: installable manifest with 192/512/maskable icons, precached offline shell, network-first pages, cache-first assets, connectivity banner.
- [ ] Moderation, reporting, rate limits, backups, observability.

### Not scoped yet, worth deciding
- [ ] Search across creators/pieces — `src/lib/search.ts` exists but is **not imported anywhere**; either wire it into Explore or delete it.
- [x] Inquiry workflow: `PENDING → REVIEWED → RESPONDED / DECLINED`, private notes, review/response timestamps, up to 3 reference images. Decisions are emailed to the recruiter via Brevo (reply-to = creative's public email) with a one-shot guard.
- [ ] Messaging between creatives and reviewers.
- [ ] Booking confirmation, payments and dispute resolution on top of the inquiry lifecycle.
- [ ] Monetisation / paid campaigns.
- [ ] Multi-language.

## How to pick
Tell me a number or a bullet from above and I'll start there. Recommended next: **apply migrations 001 + 002**, then commit the uncommitted work, then **finish `/admin`** (it unlocks join-request review, campaigns and submissions).
