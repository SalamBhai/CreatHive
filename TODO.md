# CreatHive — state & next picks

_As of 2026-11-16. Working tree clean; all work pushed to `main`._

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
- Featured-creator avatar row at top.

### Public profile `/@username`
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
- Profile: editable details, socials, gigs toggle, Save — with a live preview. Mobile uses **Edit / Preview** tabs.
- Inquiries: read view from local store.
- Add Piece: tabbed on mobile (**Details / Media / Story**), stacked on desktop; sticky Publish button.
- Full-post composer: single WYSIWYG canvas with a `+` insert menu (text, heading, quote, image, photo grid, video/audio, embed, PDF, divider). No block chips.
- Full post view `/p/[id]` for UI/UX, video, galleries, PDFs — includes image grid, media, body HTML, tags.
- Admin-only items (Campaigns, Submissions) removed from creator nav — decision recorded in `docs/MIGRATION.md`.

### Plumbing
- `useAllPieces`, `useInquiries`, `useUpdateProfile` store hooks.
- `src/lib/media.ts` (URL → safe embed), `media-format.ts` (niche → format), `tags.ts` (normalisation).
- `docs/MIGRATION.md` — phased Supabase/Cloudinary/admin plan.
- Build + typecheck green throughout. Commits pushed to `main`.

---

## 🔲 Next picks (choose tomorrow)

### Quick wins — ✅ ALL DONE
- [x] "Get your own CreatHive" pill → `/join` onboarding request flow.
- [x] Inquiry status (`PENDING → REVIEWED → RESPONDED`) stored + Studio review actions; two-lint-error-free.
- [x] Edit + delete for pieces in Studio.
- [x] Full-post page: reading progress, prev/next, share button.
- [x] `generateMetadata` for `/explore`, `/join` and `/p/[id]` (dynamic OG per piece).
- [x] Fixed the `any` lint error in `InquiryDrawer.tsx`.

### Medium — Studio / UX
- [x] Live preview panel: refresh button + auto-refresh after piece/profile saves.
- [x] Drafts: "Save as draft", Public/Unlisted/Draft visibility; public feed excludes drafts.
- [x] Reordering pieces (drag on desktop, up/down on mobile) + featured toggle + status badges.
- [ ] Avatar/banner upload UI (URL field only today) — needs Cloudinary (large phase).
- [ ] Richer full-post composer: image upload, alignment, captions, video poster — upload part needs Cloudinary.
- [x] Performance: React Compiler enabled (auto-memoisation) — no manual `useMemo`/`useCallback`.
- [x] Images: `next/image` + `remotePatterns` for Unsplash; all avatar/gallery/reel images migrated.

### Large — data & platform (see `docs/MIGRATION.md`)
- [x] Repository seam (`src/lib/repository/`) — UI now calls `repository`, with `local` and `supabase` adapters. `NEXT_PUBLIC_DATA_SOURCE` switches them (default `local`).
- [x] Applied `supabase/schema.sql` (4 tables + RLS) and flipped `NEXT_PUBLIC_DATA_SOURCE=supabase`. App runs in live mode.
- [x] Mocks remain visible alongside real data: live adapter merges `INITIAL_PROFILES`/`INITIAL_PIECES` (tagged `isYPATData:false`, `source:'mock'`), real records win on collisions. They'll be phased out as YPAT users upload.
- [x] UUID guard: mock ids (`c-sheriff-01`) are never sent to Postgres `uuid` columns; mock pieces/inquiries route to the local adapter. Fixes blank individual profiles in live mode.
- [x] Supabase Auth email/password gate (sign in / sign up, check-email state); `ensureProfile` provisions a profile keyed by `auth.uid()` on sign-in.
- [ ] Supabase project: `profiles`, `pieces`, `inquiries`, `campaigns`, `submissions`, `applause_events`; RLS policies.
- [ ] Supabase Auth + onboarding: signup, username claim, YPAT verification, `isYPATData` flag.
- [ ] Cloudinary: signed uploads, folder structure, transformations; store URL + public_id.
- [ ] Migrate mocks as seed data; keep them visible alongside real YPAT users.
- [ ] Admin page (clean, like Explore): creators, pieces, campaigns, submissions, inquiries, flags, metrics.
- [ ] Admin creates campaigns; creators submit through **Add New Piece** with campaign assignment.
- [ ] Submission workflow: `open → reviewing → accepted / rejected`; notifications (in-app + email).
- [ ] Analytics: profile views, applause, campaign conversion; audit log for admin actions.
- [ ] PWA completeness: service worker / offline shell (manifest exists, SW missing).
- [ ] Moderation, reporting, rate limits, backups, observability.

### Not scoped yet, worth deciding
- [ ] Search across creators/pieces (tags are ready for it).
- [ ] Messaging between creatives and reviewers.
- [ ] Monetisation / paid campaigns.
- [ ] Multi-language.

## How to pick
Tell me a number or a bullet from above and I'll start there. Recommended first: **edit/delete pieces** + **repository seam** — they unlock most of the rest.
