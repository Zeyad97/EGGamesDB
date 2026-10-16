# EGGameDB — Complete Backend Setup Guide

> **STATUS: Backend already configured.** Migrations 001–005 are applied, storage buckets created, Cloudinary upload preset created, and `.env.local` is filled with your live credentials. Use this guide for reference and for Vercel deployment.

---

## ✅ Already Done (live in production)

| Item | Status |
|---|---|
| Supabase project `mzuswooxwjtlfjruropg` | ✅ Created |
| Migrations 001–005 applied | ✅ Applied |
| Tables: profiles, games, game_reviews, reports, notifications, audit_logs | ✅ Created |
| RLS enabled on all tables + policies | ✅ Active |
| Storage buckets `game-assets` + `avatars` (public) + policies | ✅ Created |
| Admin user `admin@eggamedb.com` | ✅ Created & promoted to `super_admin` |
| Sample game "Dune Runner Egypt" + spotlight | ✅ Inserted |
| Cloudinary upload preset `eggamedb_uploads` (unsigned) | ✅ Created |
| `.env.local` with real keys | ✅ Filled |

**Connection details (for your reference):**
- Pooler host: `aws-1-eu-central-1.pooler.supabase.com:6543`
- Direct host: `db.mzuswooxwjtlfjruropg.supabase.co:5432` (IPv6 only)
- User: `postgres.mzuswooxwjtlfjruropg`
- Database: `postgres`

---

## Part 1: Supabase Setup

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project**
3. Fill in:
   - **Name**: `EGGameDB` (or anything you like)
   - **Database Password**: choose a strong password and **save it**
   - **Region**: pick the closest to your users (e.g. `eu-central-1` for Egypt/Middle East)
   - **Pricing Plan**: Free tier is fine to start
4. Click **Create new project** — wait 2–3 minutes for it to spin up

### Step 2 — Get Your API Keys

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy these three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://xyzabc.supabase.co`)
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (NEVER expose this to the client!)

### Step 3 — Run the Database Migrations

In the Supabase dashboard, go to **SQL Editor** and run each migration file **in order**:

1. Open `supabase/migrations/001_initial_schema.sql` → copy all → paste → **Run**
2. Open `supabase/migrations/002_rls_policies.sql` → copy all → paste → **Run**
3. Open `supabase/migrations/003_functions.sql` → copy all → paste → **Run**
4. Open `supabase/migrations/004_seed_data.sql` → copy all → paste → **Run** (optional, adds test data)

Alternatively, if you have the Supabase CLI installed:
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### Step 4 — Configure Authentication

1. Go to **Authentication** → **Providers** → **Email**
2. Ensure **Enable Email provider** is ON
3. Under **Email Templates**, you can customize the confirmation email (optional)
4. Go to **Authentication** → **URL Configuration**
5. Add these **Redirect URLs**:
   ```
   http://localhost:3000/en
   http://localhost:3000/ar
   https://your-domain.com/en    (add after deployment)
   https://your-domain.com/ar    (add after deployment)
   ```
6. Under **Authentication** → **Settings**:
   - **Enable Email Confirmations**: ON (recommended for production)
   - For development, you can turn this OFF to skip email verification

### Step 5 — Configure Storage Buckets

1. Go to **Storage**
2. Create bucket **`game-assets`**:
   - Click **New Bucket** → name: `game-assets` → **Public bucket**: ON → Create
3. Create bucket **`avatars`**:
   - Click **New Bucket** → name: `avatars` → **Public bucket**: ON → Create

The RLS policies in `002_rls_policies.sql` already define who can read/write to these buckets.

### Step 6 — Make Yourself Super Admin

After you register your account on the site:
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run:
   ```sql
   UPDATE profiles SET role = 'super_admin' WHERE username = 'your_username';
   ```
   (Replace `your_username` with the username you chose during registration)

---

## Part 2: Cloudinary Setup

Cloudinary handles image uploads (game screenshots, avatars, header images) with automatic optimization and CDN delivery.

### Step 1 — Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free tier: 25GB storage, 25GB bandwidth/month)
2. After signup, note your **Cloud Name** from the dashboard (e.g. `dxxxxxxx`)

### Step 2 — Get API Credentials

1. Go to **Settings** → **API Keys** (or the dashboard home shows them)
2. Copy:
   - **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### Step 3 — Create an Unsigned Upload Preset

For client-side uploads (from the browser):
1. Go to **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Set:
   - **Signing Mode**: Unsigned
   - **Name**: `eggamedb_uploads` (or any name)
   - **Folder**: `eggamedb` (optional, organizes uploads into a folder)
4. Click **Save**
5. Copy the preset name → `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Step 4 — (Optional) Create Signed Upload Preset

For server-side uploads with more control:
1. Create another preset with **Signing Mode**: Signed
2. Use the API Key/Secret on the server to generate signatures

### How Cloudinary Works in EGGameDB

When uploading images:
```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

const res = await fetch(
  `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
  { method: "POST", body: formData }
);
const data = await res.json();
const imageUrl = data.secure_url;
```

Delivered images use Cloudinary's CDN:
```
https://res.cloudinary.com/{cloud_name}/image/upload/w_800,q_auto,f_auto/{public_id}
```

---

## Part 3: Environment Variables

Create `.env.local` in your project root with all values filled in:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Steam API (optional but recommended for auto-import)
STEAM_API_KEY=your_steam_web_api_key

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=eggamedb_uploads

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EGGameDB

# Rate Limiting (optional, use Upstash Redis for production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Part 4: Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — it redirects to `/en`.

With Supabase configured:
- Register an account → verify email → log in
- Make yourself super_admin in Supabase SQL Editor
- Visit http://localhost:3000/en/admin → you'll see the admin dashboard

Without Supabase configured:
- A yellow SetupBanner appears at the top explaining what to do
- The site renders with placeholder data, no auth

---

## Part 5: Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial setup"
git remote add origin https://github.com/YOUR_USERNAME/eggamedb.git
git push -u origin main
```

### Step 2 — Import into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `eggamedb` repository
4. Vercel auto-detects **Next.js** — framework preset is already correct

### Step 3 — Add Environment Variables in Vercel

In the Vercel project settings (or during import), add ALL of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `STEAM_API_KEY` | Your Steam Web API key (optional) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Your Cloudinary upload preset |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `EGGameDB` |

### Step 4 — Deploy

1. Click **Deploy**
2. Wait for build to complete (usually 1–2 minutes)
3. Your site is live at `https://your-project.vercel.app`

### Step 5 — Post-Deployment

1. Add your Vercel domain to Supabase **Redirect URLs** (Step 4.5 above)
2. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your final domain
3. If using a custom domain:
   - Add it in Vercel **Settings** → **Domains**
   - Update DNS records as instructed
   - Update `NEXT_PUBLIC_APP_URL` to the custom domain
   - Add the custom domain to Supabase Redirect URLs

---

## Part 6: Get a Steam Web API Key (Optional)

1. Go to [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account
3. Fill in:
   - **Key Name**: `EGGameDB`
   - **Domain**: `localhost` (or your production domain)
4. Click **Register** → copy the key → `STEAM_API_KEY`

This enables the auto-import feature in the game submission form.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Yellow SetupBanner shows | Supabase env vars are missing or invalid. Check `.env.local`. |
| "Invalid supabaseUrl" error | The `NEXT_PUBLIC_SUPABASE_URL` must start with `https://` |
| Can't access admin | Make sure you set your role to `super_admin` in the SQL Editor |
| Steam import fails | Check `STEAM_API_KEY` is set; Steam rate-limits to 10 req/min per IP |
| Images not loading | Ensure Cloudinary preset is set to "Unsigned" for client uploads |
| Email verification not working | Check Supabase **Authentication** → **Email Templates** → **Confirm signup** |
| Build fails on Vercel | Ensure ALL env vars are added (Vercel env is separate from `.env.local`) |
| Arabic text shows as boxes | Font loading issue — check network tab for Google Fonts requests |

---

## Architecture Summary

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel (App)  │────▶│  Supabase (DB)   │     │  Cloudinary  │
│   Next.js 16    │     │  PostgreSQL      │     │  Image CDN   │
│   Edge Runtime  │     │  Auth + RLS      │     │  Upload/Host │
└─────────────────┘     │  Storage         │     └──────────────┘
        │               └──────────────────┘            │
        │                                               │
        ▼                                               ▼
   ┌──────────┐                                  ┌──────────┐
   │  Steam   │                                  │  Users   │
   │  API     │                                  │  Upload  │
   └──────────┘                                  └──────────┘
```
