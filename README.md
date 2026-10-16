# 🎮 EGGameDB — Egyptian Games on Steam

> The ultimate open-source database for Egyptian-made games on Steam. A mix between Wikipedia, Steam, and IGDB — built specifically for Egyptian game developers and players.

[![CI](https://github.com/eggamedb/eggamedb/actions/workflows/ci.yml/badge.svg)](https://github.com/eggamedb/eggamedb/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

---

## ✨ Features

- 🌍 **Bilingual** — Arabic and English with full RTL support
- 🎨 **Gaming-First UI** — CRT effects, particle fields, pixel art, glitch animations
- 🔍 **Full-text search** — PostgreSQL-powered search with fuzzy matching
- 🎮 **Steam Integration** — Auto-import game data from Steam by App ID or URL
- 🛡️ **Role-Based Access** — User → Contributor → Admin → Super Admin
- 📋 **Moderation Queue** — All submissions reviewed before publishing
- 📱 **Responsive** — Mobile-first, works on all screen sizes
- ⚡ **Fast** — Static generation where possible, ISR for game pages
- 🔒 **Secure** — Row-Level Security on every table

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── [locale]/               # i18n routing (en/ar)
│   │   ├── (public)/           # Public pages (no auth required)
│   │   │   ├── page.tsx        # Home
│   │   │   ├── games/          # Game listing & detail
│   │   │   ├── developers/     # Developer profiles
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── privacy/
│   │   │   └── terms/
│   │   ├── (auth)/             # Auth pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── (protected)/        # Auth-required pages
│   │   │   ├── submit/         # Game submission form
│   │   │   └── profile/
│   │   └── (admin)/            # Admin-only pages
│   │       └── admin/
│   └── api/                    # API routes
│       ├── steam/              # Steam data fetcher
│       └── games/              # Game CRUD
├── components/
│   ├── ui/                     # Design system (Button, Input, Card, Modal…)
│   ├── layout/                 # Navbar, Footer
│   ├── games/                  # GameCard, GameDetail, Screenshots, Filters…
│   ├── home/                   # Hero, Stats, FeaturedGames…
│   ├── auth/                   # AuthProvider, ProfileClient
│   ├── admin/                  # AdminDashboard
│   └── effects/                # CRT, Particles, Pixel art
├── lib/
│   ├── supabase/               # client.ts, server.ts, admin.ts
│   ├── steam/                  # Steam API integration
│   ├── utils/                  # cn, slugify, formatDate…
│   └── validators/             # Zod schemas
├── store/                      # Zustand (auth, ui)
├── types/                      # TypeScript interfaces
└── i18n/                       # next-intl routing + messages
supabase/
└── migrations/
    ├── 001_initial_schema.sql  # Tables, indexes, triggers
    ├── 002_rls_policies.sql    # Row Level Security
    ├── 003_functions.sql       # SQL functions
    └── 004_seed_data.sql       # Dev seed helpers
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Steam Web API key](https://steamcommunity.com/dev/apikey) (optional, for enriched data)

### 1. Clone & Install

```bash
git clone https://github.com/eggamedb/eggamedb.git
cd eggamedb
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STEAM_API_KEY=your_steam_api_key   # optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

In your Supabase project, run the migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions.sql
```

Or use the Supabase CLI:
```bash
npx supabase db push
```

### 4. Make Yourself Super Admin

After creating your account on the platform, run in Supabase SQL editor:

```sql
UPDATE profiles SET role = 'super_admin' WHERE username = 'your_username';
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en)

---

## 🎮 User Roles

| Role | Permissions |
|------|-------------|
| **User** | Browse games, write reviews, report content |
| **Contributor** | + Submit game listings for review |
| **Admin** | + Approve/reject submissions, manage reports |
| **Super Admin** | + Promote users, full platform control |

---

## 🔌 Steam Integration

When a contributor submits a game, they can enter a Steam App ID (e.g. `1234567`) or a Steam Store URL. The platform automatically fetches:

- Title, descriptions, header & capsule images
- Screenshots, trailers/videos
- Genres, categories/tags
- Release date, developer, publisher
- System requirements
- Pricing information
- Metacritic score

The contributor can then edit or complete any missing data before submitting for review.

---

## 🛡️ Security

- **RLS** on every table — users can only access data they're authorized to see
- **Auth** handled by Supabase Auth (JWT-based)
- **Input validation** with Zod on both client and server
- **Rate limiting** on Steam API endpoint (10 req/min per IP)
- **Security headers** (X-Frame-Options, CSP-ready, XSS Protection)
- **Service role key** never exposed to client

---

## 🌐 Deployment (Vercel)

1. Push your repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

**Required Vercel env vars:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Ensure TypeScript compiles: `npx tsc --noEmit`
5. Ensure build passes: `npm run build`
6. Open a Pull Request

See [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) for the checklist.

---

## 📜 License

MIT — see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

Built with love for the Egyptian gaming community. Special thanks to all Egyptian game developers who are putting Egypt on the global gaming map.

**Made with ♥ in Egypt 🇪🇬**
