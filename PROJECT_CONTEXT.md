# EGGameDB — Complete Project Context

> This file is the single source of truth for any AI agent or developer working on this project.
> It covers the vision, every file, every architectural decision, every bug fixed, and what remains to be done.
> Keep it updated as the project evolves.

---

## 1. Vision & Core Idea

**EGGameDB** is an open-source, community-driven database of Egyptian-made games available on Steam.
Think Wikipedia + Steam + IGDB, but exclusively for games built by Egyptian developers.

**Key goals:**
- Let anyone browse without an account
- Let contributors submit new games (manually or via Steam App ID auto-import)
- Moderation queue: draft → pending → approved/rejected
- Celebrate Egyptian game developers with rich developer profile pages
- Full Arabic + English support with RTL layout
- Gaming-immersive UI: CRT effects, particles, pixel art, gold palette

**Founder / Creator:** ZYAD — https://linktr.ee/zyad
Update that URL if it changes; it appears in `Footer.tsx` and `about/page.tsx`.

---

## 2. Tech Stack (exact versions)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.6 |
| Language | TypeScript | ^5 |
| UI | React | 19.2.4 |
| Styling | TailwindCSS | ^4 |
| Animation | Framer Motion | ^12 |
| Database | Supabase (PostgreSQL) | ^2 |
| Auth | Supabase Auth + `@supabase/ssr` | ^0.10.3 |
| State | Zustand | ^5 |
| Forms | React Hook Form + Zod | ^7 / ^4 |
| i18n | next-intl | ^4 |
| Theme | next-themes | ^0.4.6 |
| Icons | lucide-react | ^1.14.0 |
| Toast | react-hot-toast | ^2 |
| HTTP | axios | ^1 |
| Date | date-fns | ^4 |

**Critical version notes:**
- **Next.js 16** uses `proxy.ts` instead of `middleware.ts` (breaking change). The exported function must be named `proxy` or exported as default.
- **lucide-react v1.14.0** removed `Github`, `Twitter`, `Youtube` icons. Use `Code2`, `AtSign`, `PlayCircle` instead.
- **Zod v4** has slightly different API from v3. Generic inference works fine.
- **TailwindCSS v4** uses `@theme` / `@theme inline` instead of `tailwind.config.js`. No separate config file.
- **React 19** warns about script tags rendered in components — ThemeProvider must be inside a `"use client"` boundary.
- **`@radix-ui/react-badge` does not exist** — custom Badge component was built instead.

---

## 3. Project Structure

```
EGGameDB/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   ← Root layout (server) — html/body/head only
│   │   ├── page.tsx                     ← Redirects to /en
│   │   ├── globals.css                  ← TailwindCSS v4 theme + light/dark mode CSS vars
│   │   ├── favicon.ico
│   │   ├── [locale]/
│   │   │   ├── layout.tsx               ← Locale layout — loads fonts, passes messages to Providers
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx             ← Home page
│   │   │   │   ├── games/
│   │   │   │   │   ├── page.tsx         ← Browse/Explore page
│   │   │   │   │   └── [slug]/page.tsx  ← Game detail page
│   │   │   │   ├── developers/
│   │   │   │   │   ├── page.tsx         ← Developer directory
│   │   │   │   │   └── [username]/page.tsx ← Developer profile
│   │   │   │   ├── about/page.tsx
│   │   │   │   ├── contact/page.tsx
│   │   │   │   ├── privacy/page.tsx
│   │   │   │   └── terms/page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── verify-email/page.tsx
│   │   │   ├── (protected)/
│   │   │   │   ├── submit/page.tsx      ← Game submission form (auth required)
│   │   │   │   └── profile/page.tsx     ← User profile editor (auth required)
│   │   │   └── (admin)/
│   │   │       └── admin/page.tsx       ← Admin dashboard (admin/super_admin only)
│   │   └── api/
│   │       ├── steam/route.ts           ← GET /api/steam?id=<appid_or_url>
│   │       └── games/route.ts           ← GET /api/games (paginated list)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Providers.tsx            ← "use client" root — ThemeProvider + all providers
│   │   │   ├── Navbar.tsx               ← Top nav with locale switcher + auth state
│   │   │   ├── Footer.tsx               ← Footer with ZYAD credit + linktree link
│   │   │   └── SetupBanner.tsx          ← Amber banner shown when Supabase not configured
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx         ← Supabase auth listener → Zustand store
│   │   │   └── ProfileClient.tsx        ← Profile edit form (client)
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturedGames.tsx
│   │   │   ├── LatestGames.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── GenreShowcase.tsx
│   │   │   └── CTASection.tsx
│   │   ├── games/
│   │   │   ├── GameCard.tsx
│   │   │   ├── GamesGrid.tsx
│   │   │   ├── GameFiltersBar.tsx
│   │   │   ├── GameDetailClient.tsx     ← Full game detail (screenshots, reviews, etc.)
│   │   │   ├── GameSubmissionForm.tsx   ← Submit/edit form with Steam auto-import
│   │   │   ├── GameScreenshots.tsx
│   │   │   └── SystemRequirements.tsx
│   │   ├── admin/
│   │   │   └── AdminDashboardClient.tsx
│   │   ├── effects/
│   │   │   ├── CRTEffect.tsx            ← Overlay scanlines + flicker
│   │   │   ├── ParticleField.tsx        ← Canvas-based particle animation
│   │   │   └── PixelArtDecoration.tsx   ← PixelController, EgyptianPattern, FloatingPixels
│   │   └── ui/                          ← Custom design system components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx                ← Custom (no @radix-ui/react-badge — it doesn't exist)
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx                ← Omits HTML `prefix` attr to avoid TS conflict
│   │       ├── Modal.tsx
│   │       ├── Select.tsx
│   │       └── StarRating.tsx
│   ├── i18n/
│   │   ├── routing.ts                   ← locales: ["en","ar"], defaultLocale: "en", prefix: "always"
│   │   ├── request.ts                   ← Server config with timeZone: "Africa/Cairo"
│   │   ├── navigation.ts                ← Typed Link/redirect/useRouter for i18n
│   │   └── messages/
│   │       ├── en.json
│   │       └── ar.json
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                ← Browser client + supabaseConfigured flag
│   │   │   ├── server.ts                ← Server client (async, uses next/headers cookies)
│   │   │   └── admin.ts                 ← Service role client (server-only, never expose)
│   │   ├── steam/
│   │   │   └── index.ts                 ← fetchSteamGameData, searchSteamGames, steamDataToGameFields
│   │   ├── validators/
│   │   │   ├── auth.ts                  ← Zod schemas for login/register
│   │   │   └── game.ts                  ← Zod schema for game submission
│   │   └── utils/
│   │       └── index.ts                 ← cn, slugify, formatDate, formatNumber, extractSteamAppId, etc.
│   ├── store/
│   │   ├── auth.ts                      ← Zustand: { profile, loading }
│   │   └── ui.ts                        ← Zustand (persisted): { crtEffect, scanlines, sidebarOpen }
│   ├── types/
│   │   └── index.ts                     ← All TypeScript interfaces: Profile, Game, GameReview, etc.
│   └── proxy.ts                         ← Next.js 16 middleware (renamed from middleware.ts)
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql       ← All tables, indexes, triggers
│       ├── 002_rls_policies.sql         ← Row Level Security on every table + storage buckets
│       ├── 003_functions.sql            ← Stored procedures (admin helpers, etc.)
│       └── 004_seed_data.sql            ← Dev seed data
├── next.config.ts                       ← next-intl plugin + image domains + security headers
├── AGENTS.md                            ← AI agent instruction: read Next.js docs before coding
├── CLAUDE.md                            ← Points to AGENTS.md
└── PROJECT_CONTEXT.md                   ← THIS FILE
```

---

## 4. Environment Variables

Create `.env.local` in the project root:

```env
# Required — get from supabase.com → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Required for admin operations (server-side ONLY, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Without these**, the app still runs. A yellow `SetupBanner` appears at the top. All Supabase calls are skipped via the `supabaseConfigured` guard in `src/lib/supabase/client.ts`.

---

## 5. How to Run

```bash
# Install
npm install

# Development (7–8 seconds first load — normal, it's TypeScript compile + Turbopack)
npm run dev

# Production build (100–400ms page loads)
npm run build && npm start
```

Visit: http://localhost:3000 → auto-redirects to http://localhost:3000/en

---

## 6. Database Schema

All migrations live in `supabase/migrations/`. Run them in order via Supabase CLI or the SQL editor.

### Tables

**`profiles`** — extends `auth.users` (1:1)
- `id` UUID (FK → auth.users)
- `username` TEXT UNIQUE (3–30 chars, alphanumeric + _ -)
- `display_name`, `avatar_url`, `bio`, `website`, `twitter`, `github`, `steam_id`
- `role` ENUM: `user | contributor | admin | super_admin` (default: `user`)
- Auto-created by `handle_new_user()` trigger on `auth.users` INSERT

**`games`** — core content table
- `id`, `slug` UNIQUE, `title`, `title_ar`, `short_description`, `long_description` (+ AR variants)
- `steam_app_id` UNIQUE, `steam_url`
- `screenshots` JSONB `[]`, `videos` JSONB `[]`
- `tags TEXT[]`, `genres TEXT[]`
- `status` ENUM: `draft | pending | approved | rejected`
- `developer_id` FK → profiles, `developer_name` TEXT
- `windows_requirements`, `mac_requirements`, `linux_requirements` JSONB
- `is_free BOOLEAN`, `price_usd DECIMAL`
- `rating_count INTEGER`, `average_rating DECIMAL` — auto-updated by trigger
- `view_count INTEGER`
- `search_vector TSVECTOR` — auto-updated GIN index for full-text search
- `rejection_reason`, `reviewed_by`, `reviewed_at`

**`game_reviews`** — 1 review per user per game (UNIQUE game_id, user_id)
- `rating SMALLINT` (1–10), `content TEXT` (max 2000)
- `is_recommended BOOLEAN`, `helpful_count INTEGER`
- INSERT/UPDATE/DELETE triggers auto-recalculate `games.average_rating` and `games.rating_count`

**`reports`** — user-submitted reports
- `target_type` ENUM: `game | review | user`
- `status` ENUM: `open | resolved | dismissed`

**`notifications`** — per-user inbox
- `type` ENUM: `info | success | warning | error`
- `read BOOLEAN`, `action_url TEXT`

**`audit_logs`** — immutable admin action log
- `actor_id`, `action TEXT`, `target_type`, `target_id`, `metadata JSONB`, `ip_address INET`

### Key Triggers / Functions
- `update_game_search_vector()` — updates `search_vector` TSVECTOR on title/description/tags/genres change
- `update_game_rating()` — recalculates `average_rating` and `rating_count` after any review change
- `handle_new_user()` — creates a `profiles` row automatically when a new user signs up (derives username from email prefix, handles collisions with counter suffix)
- `set_updated_at()` — keeps `updated_at` current on profiles and games

### Storage Buckets (created in 002_rls_policies.sql)
- `game-assets` — game images, screenshots, videos
- `avatars` — user avatar uploads

---

## 7. Authentication & Authorization

**Flow:**
1. User signs up → Supabase Auth creates `auth.users` row → `handle_new_user` trigger creates `profiles` row
2. `AuthProvider.tsx` listens to `supabase.auth.onAuthStateChange` → fetches profile → stores in Zustand `useAuthStore`
3. Components read `useAuthStore().profile` and `useAuthStore().loading` for auth state

**Roles (enforced in DB via RLS + checked in proxy.ts):**
| Role | Can do |
|---|---|
| `user` | Browse, write reviews, submit reports |
| `contributor` | All user + submit games (skip straight to pending) |
| `admin` | All contributor + approve/reject games, resolve reports, manage users |
| `super_admin` | All admin + promote/demote admins |

**Route protection (proxy.ts):**
- `/submit`, `/profile`, `/dashboard` → redirects to `/{locale}/login` if no session
- `/admin` → redirects to `/{locale}` if user is not `admin` or `super_admin`
- Protection is skipped if `supabaseConfigured === false` (dev mode without .env.local)

**Supabase clients:**
- `src/lib/supabase/client.ts` → `createBrowserClient` — use in `"use client"` components
- `src/lib/supabase/server.ts` → `createServerClient` — use in Server Components and API routes (async, uses `next/headers`)
- `src/lib/supabase/admin.ts` → service role client — use ONLY in server-side admin operations

---

## 8. i18n (Internationalization)

**Locales:** `en` (default), `ar`
**URL structure:** `/en/games`, `/ar/games` — `localePrefix: "always"` means locale is always in the URL
**RTL:** Arabic pages get `dir="rtl"` on `<html>`, font switches to Cairo/Tajawal via CSS `[dir="rtl"]` selector
**Timezone:** `Africa/Cairo` — set in both `src/i18n/request.ts` (server) and `NextIntlClientProvider` (client)

**Key files:**
- `src/i18n/routing.ts` — defines locales and routing config
- `src/i18n/request.ts` — server-side config, loads message JSON
- `src/i18n/navigation.ts` — exports typed `Link`, `redirect`, `useRouter`, `usePathname` for locale-aware navigation (always use these instead of `next/navigation` equivalents)
- `src/i18n/messages/en.json` — English strings
- `src/i18n/messages/ar.json` — Arabic strings

**Usage in components:**
```typescript
import { useTranslations } from "next-intl";
const t = useTranslations("nav"); // namespace matches key in messages JSON
t("explore") // → "Explore" or "استكشف"
```

---

## 9. Design System & CSS

### Color Palette (Gold gaming theme)

The CSS uses a light/dark switching mechanism via CSS custom properties.

**`globals.css` structure:**
1. `@theme inline { ... }` — tells Tailwind to emit `var()` references, making utilities dynamic
2. `:root { ... }` — light mode values
3. `.dark { ... }` — dark mode values (applied by `next-themes` to `<html>`)

**Tokens:**
```
eg-gold    → #FFD700  (accent, same in both modes)
eg-dark    → light: #f5f4ef  / dark: #0f0f0f  (page background)
eg-darker  → light: #e8e7e0  / dark: #080808  (footer, secondary bg)
eg-card    → light: #ffffff  / dark: #141414  (card background)
eg-surface → light: #f0efe8  / dark: #1a1a1a  (slightly elevated surface)
eg-border  → light: rgba(160,120,0,0.2) / dark: rgba(255,215,0,0.15)
eg-muted   → #6b7280 (same in both)
```

**Body text color** uses `var(--eg-text)`:
- Light: `#111827`
- Dark: `#e5e7eb`

**Custom utilities:**
- `.font-pixel` — Press Start 2P (pixel font)
- `.gold-gradient` — text with gold-to-orange gradient fill
- `.eg-glow` — text-shadow gold glow effect
- `.pixel-corners` — clip-path for pixel-art style corners
- `.prose-game` — rich text styles for game descriptions
- `.req-block` — Steam-style system requirements block

### Typography
- **UI font:** Inter (loaded via Google Fonts link in `[locale]/layout.tsx`)
- **Pixel font:** Press Start 2P
- **Arabic font:** Cairo, Tajawal

### Visual Effects
- **CRTEffect** (`src/components/effects/CRTEffect.tsx`) — scanline overlay + flicker animation, togglable via `useUIStore().crtEffect`
- **ParticleField** (`src/components/effects/ParticleField.tsx`) — canvas-based particles
- **FloatingPixels** — deterministic pixel positions (no `Math.random()` — prevents SSR hydration mismatch). Uses `mounted` state to render nothing on server.
- **EgyptianPattern** — decorative hieroglyph tiling
- **PixelController** — animated pixel-art gamepad decoration

### Animations (defined as keyframes in globals.css)
- `crt-flicker` — subtle opacity flicker
- `glitch-1`, `glitch-2` — clip-path based text glitch effect
- `float` — gentle up/down float
- `scanline` — moving CRT scan line
- `pulse-gold` — gold glow pulsing box-shadow
- `pixel-bounce` — stepped pixel bounce

---

## 10. State Management (Zustand)

**`useAuthStore`** (`src/store/auth.ts`) — not persisted (session is managed by Supabase)
```typescript
{ profile: Profile | null, loading: boolean }
```

**`useUIStore`** (`src/store/ui.ts`) — persisted to `localStorage` as `"eggamedb-ui"`
```typescript
{ sidebarOpen: boolean, crtEffect: boolean, scanlines: boolean }
```

---

## 11. Steam API Integration

**Route:** `GET /api/steam?id=<steam_app_id_or_url>`

**What it does:**
1. Extracts App ID from input (plain number or full Steam URL) via `extractSteamAppId()`
2. Rate-limits by IP: 10 requests per minute (in-memory Map — use Redis for production)
3. Fetches from `https://store.steampowered.com/api/appdetails?appids=<id>&cc=us&l=english`
4. Maps Steam response to our `Game` schema fields via `steamDataToGameFields()`
5. Response is cached for 1 hour via Next.js `fetch` revalidation

**The submission form** (`GameSubmissionForm.tsx`) calls this endpoint and pre-fills all fields including screenshots, videos, genres, tags, requirements, and pricing.

---

## 12. API Routes

**`GET /api/steam?id=`** — fetch Steam game metadata
**`GET /api/games`** — paginated game list with filters (search, genre, tag, status, sort)

---

## 13. Known Bugs Fixed (do not reintroduce)

### next-themes ThemeProvider in Server Component (React 19)
**Problem:** ThemeProvider inside a server component causes React 19 to warn about script tags.
**Fix:** `src/components/layout/Providers.tsx` is a `"use client"` component that wraps all providers. The locale layout server component only renders `<html>/<head>/<body>`.

### Supabase crash with missing env vars
**Problem:** `createBrowserClient("", "")` throws `Invalid supabaseUrl`.
**Fix:** `supabaseConfigured` boolean in `client.ts` + placeholder URLs. All Supabase calls are skipped in `AuthProvider` and `proxy.ts` when not configured. `SetupBanner` explains setup to the developer.

### FloatingPixels hydration mismatch
**Problem:** `Math.random()` produces different values on server vs client → React hydration error.
**Fix:** Deterministic `PIXEL_DATA` array computed once at module level. `FloatingPixels` returns `null` until `mounted` is `true` (avoids rendering on server entirely).

### Next.js 16 middleware rename
**Problem:** `middleware.ts` with exported `middleware` function → deprecation warning.
**Fix:** Renamed to `proxy.ts`. Exported function is named `proxy`. Added `export default proxy`.

### lucide-react v1.14.0 removed icons
**Problem:** `Github`, `Twitter`, `Youtube` icons no longer exist in this version.
**Fix:** Use `Code2` (GitHub), `AtSign` (Twitter/X), `PlayCircle` (YouTube) everywhere.

### `@radix-ui/react-badge` doesn't exist
**Problem:** NPM 404 — this package was never published.
**Fix:** Custom `Badge` component in `src/components/ui/Badge.tsx`.

### Input `prefix` prop conflict
**Problem:** `React.InputHTMLAttributes<HTMLInputElement>` includes `prefix?: string` which conflicts with a custom prop of the same name.
**Fix:** `Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix">` in Input component props.

### Zod boolean default in React Hook Form
**Problem:** `z.boolean().default(false)` confuses the resolver into making the field optional, causing type mismatch with `handleSubmit`.
**Fix:** Remove `.default(false)` from the schema; set the default in `useForm({ defaultValues: { is_free: false } })` instead.

### Framer Motion `Variants` type error with dynamic indices
**Problem:** A function `(i: number) => { opacity: 1, y: 0, ... }` doesn't match Framer Motion's `TargetResolver` type when used as a `Variants` value.
**Fix:** Pass the plain animation object directly to the `animate` prop: `animate={getVariant(0)}` where `getVariant` returns a plain object.

### next-intl timezone warning
**Problem:** Missing `timeZone` in server and client config.
**Fix:** Added `timeZone: "Africa/Cairo"` to both `src/i18n/request.ts` and the `NextIntlClientProvider` in `Providers.tsx`.

---

## 14. Pages & Routes

| Route | File | Auth | Notes |
|---|---|---|---|
| `/` | `src/app/page.tsx` | No | Redirects to `/en` |
| `/{locale}` | `[locale]/(public)/page.tsx` | No | Home page |
| `/{locale}/games` | `[locale]/(public)/games/page.tsx` | No | Browse with filters |
| `/{locale}/games/{slug}` | `[locale]/(public)/games/[slug]/page.tsx` | No | Game detail |
| `/{locale}/developers` | `[locale]/(public)/developers/page.tsx` | No | Developer directory |
| `/{locale}/developers/{username}` | `[locale]/(public)/developers/[username]/page.tsx` | No | Developer profile |
| `/{locale}/about` | `[locale]/(public)/about/page.tsx` | No | About + ZYAD credit |
| `/{locale}/contact` | `[locale]/(public)/contact/page.tsx` | No | Contact form |
| `/{locale}/privacy` | `[locale]/(public)/privacy/page.tsx` | No | Privacy policy |
| `/{locale}/terms` | `[locale]/(public)/terms/page.tsx` | No | Terms of service |
| `/{locale}/login` | `[locale]/(auth)/login/page.tsx` | No | Login form |
| `/{locale}/register` | `[locale]/(auth)/register/page.tsx` | No | Registration form |
| `/{locale}/verify-email` | `[locale]/(auth)/verify-email/page.tsx` | No | Email verification |
| `/{locale}/submit` | `[locale]/(protected)/submit/page.tsx` | Any user | Game submission |
| `/{locale}/profile` | `[locale]/(protected)/profile/page.tsx` | Any user | Edit own profile |
| `/{locale}/admin` | `[locale]/(admin)/admin/page.tsx` | admin/super_admin | Moderation dashboard |

---

## 15. What Is NOT Done Yet (as of project start)

- **Supabase project not created** — user needs to create a project at supabase.com and run the 4 migration files
- **`.env.local` not filled** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **No real games in the database** — `004_seed_data.sql` has dev seed data for testing
- **Email confirmation** — Supabase email templates not customized yet
- **Redis rate limiting** — currently in-memory (resets on server restart); replace with Upstash Redis for production
- **No CDN/edge caching** — currently relies on Next.js ISR only
- **CI/CD pipeline** — `.github/` directory exists but workflows not written
- **No custom domain** — project runs on localhost in dev, no deployment configured
- **Arabic translations** — `ar.json` may have placeholder strings; needs native speaker review

---

## 16. Important Patterns to Follow

### Always use i18n-aware navigation
```typescript
// CORRECT
import { Link } from "@/i18n/navigation";
<Link href="/games">...</Link>

// WRONG — skips locale prefix
import Link from "next/link";
<Link href="/games">...</Link>
```

### Always check supabaseConfigured before Supabase calls in client
```typescript
import { supabaseConfigured, createClient } from "@/lib/supabase/client";
if (!supabaseConfigured) return; // bail out gracefully
const supabase = createClient();
```

### Server components fetch data directly; client components use Zustand or props
Server components can `await createClient()` from `@/lib/supabase/server`. Client components should read from Zustand or receive data as props.

### Framer Motion animations: use plain objects, not Variants functions
```typescript
// CORRECT
<motion.div animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>

// WRONG — type error with custom resolver functions
const variants: Variants = { visible: (i) => ({ ... }) };
```

### TailwindCSS v4 — no tailwind.config.js
All tokens go in `@theme` / `@theme inline` in `globals.css`. Arbitrary values still work: `w-[123px]`, `text-[#aabbcc]`.

### New pages must be inside `[locale]/(group)/`
Route groups `(public)`, `(auth)`, `(protected)`, `(admin)` are purely organizational — they don't affect the URL. Every page must be inside `[locale]/` to participate in i18n.

---

## 17. Next.js 16 Specifics

- **Middleware file**: `src/proxy.ts` (not `middleware.ts`)
- **Middleware export**: must be `export async function proxy(request)` or `export default function(request)`
- **Server component async params**: `params` is a Promise in Next.js 16. Always `await` it:
  ```typescript
  export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
  ```
- **`cookies()`** from `next/headers` is async — always `await cookies()`
- **Read the docs in `node_modules/next/dist/docs/`** before writing new Next.js code (per AGENTS.md)

---

## 18. File Relationships Diagram

```
[locale]/layout.tsx (server)
  └── Providers.tsx (client)
        ├── ThemeProvider (next-themes) → adds/removes .dark on <html>
        ├── NextIntlClientProvider → locale + messages + timeZone
        ├── AuthProvider → supabase.auth → useAuthStore (Zustand)
        ├── SetupBanner → shows if supabaseConfigured === false
        ├── CRTEffect → reads useUIStore().crtEffect
        ├── Navbar → reads useAuthStore().profile + useTranslations
        ├── <main>{children}</main>
        └── Footer → static links + ZYAD linktree credit

proxy.ts (Next.js 16 middleware)
  ├── Checks PROTECTED_PATHS → redirect to login if no session
  ├── Checks ADMIN_PATHS → redirect home if not admin
  └── Falls through to intlMiddleware (next-intl routing)

src/lib/supabase/
  ├── client.ts → supabaseConfigured flag + createBrowserClient (use in "use client")
  ├── server.ts → createServerClient (use in server components/API routes)
  └── admin.ts  → service role (use ONLY server-side for admin ops)
```
