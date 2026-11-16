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

### Quick wins
- [ ] Wire the "Get your own CreatHive" pill to a real signup/onboarding flow (currently → `/studio`).
- [ ] Make the inquiry submit path store status and notify (currently local only).
- [ ] Add edit/delete for pieces in Studio (currently add-only).
- [ ] Polish the full-post page: prev/next piece, reading progress, share button.
- [ ] Add `generateMetadata` for `/explore` and `/p/[id]` (dynamic OG per piece).
- [ ] Fix the remaining pre-existing lint error: `InquiryDrawer.tsx:147` (`any` type).

### Medium — Studio / UX
- [ ] Live preview panel: refresh on edit, not just on route load.
- [ ] Drafts: "Save as draft" vs "Publish"; unlisted/private pieces.
- [ ] Reordering pieces (drag/drop) + featured toggle.
- [ ] Avatar/banner upload UI (URL field only today).
- [ ] Richer full-post composer: image upload, alignment, captions, video poster.

### Large — data & platform (see `docs/MIGRATION.md`)
- [ ] Repository seam (`src/lib/repository/`) so UI stops touching localStorage directly.
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
