# CreatHive — Implementation & Architecture Specification

> **"Built for the limitless Creatives..."**  
> A mobile-first Progressive Web App (PWA) designed for creatives to showcase multi-discipline portfolios, capture opportunities, and manage their creative assets with unlimited freedom.

---

## 1. Executive Summary & Context

### 1.1 The Genesis
Initiated in response to the UNICEF / Generation Unlimited Nigeria (GenU 9JA) 2026–27 Young People's Action Team (YPAT) creative talent call:
> *"If you’re into spoken word, poetry, music, dance, or any other creative field, please share about what you do alongside the link to the sample of your work."*

### 1.2 The Core Problem
When prompted to share creative samples, 90% of creatives submit fragmented, friction-heavy links:
- Private Google Drive folders with permission barriers.
- Cluttered social media profiles (Instagram/TikTok/X) where talent is buried under algorithms and personal posts.
- Plain text emails that lack immersion for audio, performance, and literary arts.

### 1.3 The Solution: CreatHive
CreatHive bridges this gap by offering:
1. **For Reviewers & Recruiters (The Conversion Funnel):** A single, frictionless link (`creathive.app/@username`) that opens instantly on mobile or desktop, showcases multimedia work (audio, video, poetry, visual art) in a distraction-free player/reader, and features direct action buttons (*"Book for Performance"*, *"Applaud"*, *"Inquire"*).
2. **For Creatives (The Creator Studio):** An intuitive mobile-first studio with unlimited management access to publish, curate, reorder, and style their work.
3. **For the Engineer (The Proof of Work):** Serves as a living, production-ready showcase of product engineering, technical initiative, and ecosystem impact.

---

## 2. Design Philosophy & Brand Identity

### 2.1 Brand Identity
* **Wordmark / Logo:** Playful, fluid, liberal script inspired by Canva’s iconic swooping wordmark. Communicates boundless freedom, creativity, and friendliness.
* **Tagline:** *"Built for the limitless Creatives..."*
* **Color Palette:**
  * **Primary Accent:** Hive Ochre / Coral Flame (`#FF5A36` or `#FF7844`) — warm, energized, creative.
  * **Canvas Background:** Warm Paper / Artist Canvas (`#FDFBF7`) instead of sterile `#FFFFFF`.
  * **Surface / Card:** Clean White (`#FFFFFF`) with crisp charcoal borders (`#1E1E1E`).
  * **Text Primary:** Deep Charcoal (`#121212`) for high legibility.
  * **Text Secondary:** Muted Slate (`#6B7280`).

### 2.2 Aesthetic: Kinetic Neo-Editorial (High-Taste Artistry, Never "Mid")
* **The Antidote to Boring SaaS:** Minimal does not mean lifeless or dry. CreatHive is an app for artists, dancers, poets, and visual creators—every interaction must feel fluid, tactile, and expressive.
* **No Generic Emojis:** Replace OS emojis with cohesive, expressive SVG icons (Phosphor Duotone / Bold) featuring custom multi-tone fills and dynamic states.
* **Kinetic Micro-Interactions (Framer Motion):**
  * **Spring Physics:** Buttons and cards physically compress into their drop shadows on tap (`scale: 0.97`, shadow snaps from `3px` to `0px`).
  * **Shared Layout Transitions (`layoutId`):** Tab indicator glides smoothly across discipline filters.
  * **Dynamic Waveforms:** Spoken word audio playback triggers kinetic pulsing SVG waveforms.
  * **Native Gesture Sheets:** Bottom drawers for inquiry and poetry reading feature springy velocity drag-to-dismiss.
* **Warm Canvas & Paper Texture:** Subtle organic grain on `#FDFBF7` canvas paired with crisp borders and glowing coral-amber accents.

### 2.3 Typography & Icon Stack
* **Brand / Script:** Dynamic Canva-inspired script wordmark with custom ligature and spark accent.
* **UI & Headings:** `Plus Jakarta Sans` — clean, friendly, geometric curves.
* **Editorial / Poetry Reader:** `Newsreader` / `Instrument Serif` — literary distinction for spoken word and verse.
* **Icon Engine:** `@phosphor-icons/react` (Duotone & Bold weights) — studio-grade, expressive vector icons for disciplines, actions, and media controls.

---

## 3. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 15+ (App Router)                    │
│  - Server Components (SSR / Dynamic OG Social Meta)         │
│  - Server Actions & Route Handlers                          │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
    ┌──────────▼──────────┐         ┌──────────▼──────────┐
    │     Client PWA      │         │     Data Engine     │
    │  - App Shell / Tabs │         │  - TanStack Query   │
    │  - Framer Motion    │         │  - Optimistic State │
    │  - Serwist / SW     │         │  - Local / Remote   │
    └─────────────────────┘         └─────────────────────┘
```

### 3.1 Technology Choices

| Layer | Technology | Justification |
|---|---|---|
| **Framework** | **Next.js 15+ (App Router)** | SSR for instant initial loads; Dynamic OG image generation for WhatsApp/Twitter previews; API routes in one repo. |
| **PWA & Offline** | **`@serwist/next`** (or modern Workbox worker) | App manifest, standalone display mode, background service worker, offline shell caching. |
| **Data Fetching & Cache** | **TanStack Query (React Query v5)** | Instant caching, optimistic UI updates when adding/editing pieces, background refetching, offline mutation queue. |
| **Styling** | **Tailwind CSS v4** | Rapid utility-first styling, native safe-area utilities (`env(safe-area-inset-bottom)`), responsive container queries. |
| **Animations & Gestures** | **Framer Motion** | Spring physics, layout morphs (`layoutId`), velocity-drag bottom sheets, staggered reveals. |
| **Icons & Visual Language** | **`@phosphor-icons/react`** | Duotone & Bold studio-grade SVG icons; zero generic OS emojis; custom multi-tone discipline badges. |
| **Media Handling** | **HTML5 Audio API + Video Embeds** | Native audio player with waveform scrub for spoken word/music; YouTube/Vimeo/Cloudflare Stream embed support for dance/video. |

---

## 4. User Journeys & Funnel Mechanics

### Funnel 1: The Reviewer / Recruiter Journey (Public Conversion Funnel)
```
Open Link (e.g., creathive.app/@sheriff)
  │
  ├── 1. Dynamic OpenGraph Preview in WhatsApp / Email
  │    (Avatar + Stage Name + Discipline Badge + Bio)
  │
  ├── 2. Hero Header
  │    - Headshot / Profile photo
  │    - Name, Handle & Verified Badge
  │    - Discipline Tags (e.g. "Spoken Word Poet", "UI/UX & Tech Imagery")
  │    - Bio & Social Links
  │
  ├── 3. Segmented Showcase Navigation (Sticky Tabs)
  │    [ All ] [ 🎙️ Spoken Word ] [ ✍️ Poetry ] [ 💃 Dance ] [ 🎨 Tech Imagery & UI/UX ]
  │
  ├── 4. Interactive Media Feed
  │    - Spoken Word: Integrated audio player with synchronized read-along script.
  │    - Dance / Reels: Vertical video cards with ambient preview.
  │    - Poetry / Articles: Substack-style rich reader modal.
  │    - Tech Imagery & Design: Walkthrough reels, high-res UI screen carousels, and Figma embeds (no code syntax).
  │
  └── 5. Sticky Bottom Action Bar (Conversion Triggers)
       ├── "Book / Invite for Performance" (Opens direct inquiry drawer)
       ├── "Applaud" (Instant interactive counter)
       └── "Share Profile" (Native Web Share API / WhatsApp direct link)
```

### Funnel 2: The Creative Journey (Creator Studio & Management)
```
Studio Dashboard (/studio)
  │
  ├── 1. Live Mobile Device Preview (Simulates what reviewers see)
  │
  ├── 2. Quick Create (+ FAB Button)
  │    - Select Discipline (Spoken Word, Poetry, Music, Dance, Tech Imagery, UI/UX, Graphic Design)
  │    - Title & Subtitle / Context
  │    - Media Payload (Audio upload/link, Video embed, Image Carousel, or Rich Text)
  │    - Publishing status (Public / Unlisted / Draft)
  │
  ├── 3. Portfolio Customization
  │    - Profile Details (Avatar, Banner, Bio, Location, Open to Opportunities toggle)
  │    - Theme Vibe: "Soft Neo-Brutal" vs "Minimal Editorial"
  │
  └── 4. Inquiries & Insights
       - Received performance/gig inquiries
       - Total profile views and piece applauses
```

---

## 5. Data Models & Schemas

### 5.1 Profile / Creative (`User`)
```typescript
interface CreativeProfile {
  id: string;
  username: string; // e.g. "sheriff" -> creathive.app/@sheriff
  displayName: string;
  tagline: string; // e.g. "Software Engineer & Creative Technologist"
  bio: string;
  avatarUrl: string;
  disciplines: CreativeDiscipline[]; // ["SPOKEN_WORD", "SOFTWARE_ENGINEERING"]
  location?: string;
  isAvailableForGigs: boolean;
  socialLinks: {
    whatsapp?: string;
    email?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  themeSettings: {
    mode: "soft-brutal" | "editorial";
    accentColor: string; // default "#FF5A36"
  };
  createdAt: string;
}

type CreativeDiscipline = 
  | "SPOKEN_WORD" 
  | "POETRY" 
  | "MUSIC" 
  | "DANCE" 
  | "TECH_IMAGERY" 
  | "UIUX_DESIGN" 
  | "GRAPHIC_DESIGN" 
  | "MOTION_ANIMATION"
  | "OTHER";
```

### 5.2 Creative Piece (`Piece`)
```typescript
interface CreativePiece {
  id: string;
  creativeId: string;
  title: string;
  description?: string;
  discipline: CreativeDiscipline;
  mediaType: "AUDIO" | "VIDEO" | "TEXT" | "IMAGE_GALLERY";
  mediaUrl?: string; // Audio file URL or Video embed URL
  textContent?: string; // Markdown or rich text for poetry / spoken word lyrics
  coverImageUrl?: string;
  isFeatured: boolean;
  applauseCount: number;
  metadata?: {
    durationSeconds?: number;
    yearProduced?: string;
    eventContext?: string; // e.g. "Performed at YPAT 2026 Summit"
  };
  createdAt: string;
}
```

### 5.3 Performance Inquiry (`Inquiry`)
```typescript
interface PerformanceInquiry {
  id: string;
  creativeId: string;
  senderName: string;
  senderOrganization?: string; // e.g. "UNICEF Nigeria / GenU 9JA"
  senderEmail: string;
  senderPhone?: string;
  eventType: "PERFORMANCE" | "COLLABORATION" | "SPEAKING" | "EMPLOYMENT";
  message: string;
  eventDate?: string;
  status: "PENDING" | "REVIEWED" | "RESPONDED";
  createdAt: string;
}
```

---

## 6. Directory Structure

```
CreatHive/
├── public/
│   ├── manifest.json            # PWA Manifest
│   ├── icons/                   # App icons (192x192, 512x512, maskable)
│   ├── fonts/                   # Local optimized fonts
│   └── sw.js                    # Service worker script
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Global App Shell, Font injectors, Providers
│   │   ├── page.tsx             # Landing / Welcome / Directory page
│   │   ├── [username]/          # Public Creative Portfolio route (@username)
│   │   │   ├── page.tsx         # The high-converting portfolio view
│   │   │   └── opengraph-image.tsx # Dynamic WhatsApp/Twitter OG image generator
│   │   ├── studio/              # Unlimited Management Creator Studio
│   │   │   ├── page.tsx         # Studio Overview & Live Device Preview
│   │   │   ├── pieces/          # Piece manager (CRUD)
│   │   │   ├── profile/         # Profile & Theme settings
│   │   │   └── inquiries/       # Lead & performance requests
│   │   └── api/                 # Next.js Server Endpoints
│   ├── components/
│   │   ├── brand/               # Playful Canva-inspired logo & wordmark
│   │   ├── ui/                  # Soft Neo-Brutal UI primitives (Button, Card, Badge, Modal)
│   │   ├── portfolio/           # Profile header, piece cards, filter pills
│   │   ├── media/               # Audio player, Video embed, Poetry reader
│   │   ├── studio/              # Editor drawer, piece form, preview frame
│   │   └── pwa/                 # Install prompt, Offline banner, Bottom nav
│   ├── lib/
│   │   ├── query-client.ts      # TanStack Query client & cache configuration
│   │   ├── types.ts             # TypeScript domain schemas
│   │   └── sample-data.ts       # Rich default sample data (Sheriffdeen YPAT showcase)
│   └── styles/
│       └── globals.css          # Tailwind directives, Safe-area CSS, custom shadows
├── IMPLEMENTATION.md            # This specification document
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 7. Phased Implementation Roadmap

### Phase 1: Foundation & Design System
- [ ] Initialize Next.js 15+ App Router with TypeScript & Tailwind CSS.
- [ ] Set up TanStack Query provider and client cache.
- [ ] Implement Brand Assets: Playful "CreatHive" cursive/script logo component + tagline.
- [ ] Build Soft Neo-Brutalist UI Primitives:
  - `NeoButton`: Tactile chunky button with `shadow-[2.5px_2.5px_0px_#000]`.
  - `NeoCard`: Clean paper card with 1.5px border and offset shadow.
  - `DisciplinePill`: Colorful rounded chips with solid stroke.

### Phase 2: Public Creative Portfolio (`/[username]`)
- [ ] Profile Hero Component: Avatar, Stage Name, Discipline tags, Bio, Social links.
- [ ] Sticky Discipline Filter Bar (`All`, `Spoken Word`, `Poetry`, `Dance`, `Code`).
- [ ] Multimedia Showcase Cards:
  - **Spoken Word / Audio Player:** Tactile play/pause, scrub bar, read-along text toggle.
  - **Dance / Video Card:** Clean 9:16 / 16:9 responsive video wrapper.
  - **Poetry Reader Mode:** Substack-style clean typography reader modal.
- [ ] Sticky Bottom Conversion Bar:
  - Quick "Book for Performance" trigger.
  - "Applaud" reaction counter.
  - Native Web Share / WhatsApp share drawer.

### Phase 3: Creator Studio (`/studio`)
- [ ] Studio Shell: Responsive mobile frame for desktop preview + native mobile view.
- [ ] Piece Editor Drawer: Form to create/edit piece (Title, Discipline, Media URL/Text, Notes).
- [ ] Optimistic Updates: TanStack Query mutations to instantly reflect additions and updates.
- [ ] Profile Settings & Opportunity Availability toggle.

### Phase 4: PWA & Social Share Engine
- [ ] Web App Manifest (`manifest.json`) configuration with mobile standalone display.
- [ ] Service worker registration & offline cache strategy.
- [ ] Dynamic OpenGraph Image (`opengraph-image.tsx`) for instant social card rendering when shared on WhatsApp/X.

### Phase 5: Production Polish & Submission
- [ ] Populate Sheriffdeen's actual YPAT profile (Software Engineer & Creative Technologist showcase).
- [ ] Test on real mobile devices (iOS Safari & Android Chrome).
- [ ] Deploy to Vercel with custom domain.
- [ ] Prepare clean submission email to UNICEF coordinators.
