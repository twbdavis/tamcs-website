# Texas A&M Club Swim — Website

The web app replacing the old Wix site for Texas A&M Club Swim
([tamuclubswim.com](https://tamuclubswim.com)).

Built on **Next.js 16** (App Router) with **Supabase** for auth + database,
**Tailwind CSS v4**, **shadcn/ui** components, and **MDX** for the blog.

> Note: the spec called for Next 15, but `create-next-app@latest` now ships
> Next 16. The patterns used here (App Router, async `cookies()` / `params`)
> are unchanged. The old `middleware.ts` convention is renamed to `proxy.ts`
> in Next 16 — that's the only structural difference to watch for.

---

## Required environment variables

Copy `.env.local.example` → `.env.local` and fill in from the Supabase
dashboard (Settings → API):

| Variable | Where to find it | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` / secret key | no (server only) |

---

## Running locally

Requires **Node 22 LTS** (see `.nvmrc`).

```bash
nvm use           # or volta / fnm / manual
npm install
npm run dev       # http://localhost:3000
```

Scripts:
- `npm run dev` — Next dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve a production build
- `npm run lint` — run ESLint

---

## Running the database migration

The migration lives at `supabase/migrations/0001_initial_schema.sql`. It is
**idempotent** — safe to paste into the Supabase SQL editor and re-run.

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/migrations/0001_initial_schema.sql`.
3. Run it.

You'll get:
- `user_role` enum (athlete, coach, officer, admin, alumni, guest)
- `profiles` table linked to `auth.users`
- Auto-create trigger (new auth user → profile row)
- Role-change guard (only officers/admins can promote/demote)
- RLS policies (users see/update their own; officers/admins see/update all)

---

## Supabase Dashboard Setup

A few things must be configured in the Supabase dashboard (not code).

### 1. Password policy

Settings → **Authentication** → **Policies** → **Password requirements**.

Set:
- Minimum password length: **8**
- Required characters: at minimum **Letters and Digits**
  (must match the Zod schema in `lib/validations.ts`).

The app validates the same rules client-side, but Supabase is the source of
truth — keep these in sync.

### 2. Site URL and redirect URLs

Settings → **Authentication** → **URL Configuration**.

- **Site URL:** your production URL (e.g. `https://tamuclubswim.com`).
- **Redirect URLs allowlist:**
  - `http://localhost:3000/**`
  - `https://YOUR-PRODUCTION-DOMAIN/**`

Without these, the links in confirmation/reset emails will bounce with
"redirect not allowed".

### 3. Email templates

Settings → **Authentication** → **Email Templates**.

> **Important:** Our `/auth/confirm` route uses the `token_hash` + `type`
> flow (the newer Supabase pattern). The template links below build that
> URL manually from `{{ .SiteURL }}`, `{{ .TokenHash }}`, and the
> appropriate `type` value. If you use the default `{{ .ConfirmationURL }}`
> Supabase provides, it will use the legacy `?token=...` format, which
> this app doesn't handle.

Paste the HTML below into the matching template.

#### Confirm signup

**Subject:** `Confirm your TAMCS account`

```html
<!doctype html>
<html>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f7f7f8; margin: 0; padding: 32px 0; color: #111;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr><td style="background: #500000; color: #ffffff; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Texas A&amp;M Club Swim</h1>
      </td></tr>
      <tr><td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">Confirm your account</h2>
        <p style="margin: 0 0 24px; line-height: 1.5;">Welcome to TAMCS. Click the button below to confirm your email and finish setting up your account.</p>
        <p style="margin: 24px 0;">
          <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
             style="display: inline-block; background: #500000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
             Confirm email
          </a>
        </p>
        <p style="margin: 24px 0 0; font-size: 13px; color: #666;">If you didn't sign up, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </body>
</html>
```

#### Magic link (unused for now, but wire it up for consistency)

**Subject:** `Your TAMCS sign-in link`

```html
<!doctype html>
<html>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f7f7f8; margin: 0; padding: 32px 0; color: #111;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr><td style="background: #500000; color: #ffffff; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Texas A&amp;M Club Swim</h1>
      </td></tr>
      <tr><td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">Sign in</h2>
        <p style="margin: 0 0 24px; line-height: 1.5;">Click the button below to sign in to TAMCS. This link expires shortly.</p>
        <p style="margin: 24px 0;">
          <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink"
             style="display: inline-block; background: #500000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
             Sign in to TAMCS
          </a>
        </p>
        <p style="margin: 24px 0 0; font-size: 13px; color: #666;">Didn't request this? You can ignore this email.</p>
      </td></tr>
    </table>
  </body>
</html>
```

#### Reset password

**Subject:** `Reset your TAMCS password`

```html
<!doctype html>
<html>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f7f7f8; margin: 0; padding: 32px 0; color: #111;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr><td style="background: #500000; color: #ffffff; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Texas A&amp;M Club Swim</h1>
      </td></tr>
      <tr><td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">Reset your password</h2>
        <p style="margin: 0 0 24px; line-height: 1.5;">We got a request to reset your TAMCS password. Click below to set a new one. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
             style="display: inline-block; background: #500000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
             Reset password
          </a>
        </p>
        <p style="margin: 24px 0 0; font-size: 13px; color: #666;">Didn't request a reset? You can ignore this email — your password will stay the same.</p>
      </td></tr>
    </table>
  </body>
</html>
```

#### Change email

**Subject:** `Confirm your new TAMCS email address`

```html
<!doctype html>
<html>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f7f7f8; margin: 0; padding: 32px 0; color: #111;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr><td style="background: #500000; color: #ffffff; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Texas A&amp;M Club Swim</h1>
      </td></tr>
      <tr><td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">Confirm your new email</h2>
        <p style="margin: 0 0 24px; line-height: 1.5;">Click below to confirm the new email address on your TAMCS account.</p>
        <p style="margin: 24px 0;">
          <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change"
             style="display: inline-block; background: #500000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
             Confirm new email
          </a>
        </p>
        <p style="margin: 24px 0 0; font-size: 13px; color: #666;">If you didn't request this change, contact a TAMCS officer.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## Promoting a user to officer or admin

By default, every new signup gets the `guest` role. Promote via SQL:

```sql
update public.profiles
set role = 'officer'
where email = 'you@example.com';
```

The role-change trigger (`guard_profile_role_change`) blocks self-promotion
in normal app flows — but running this from the Supabase SQL editor runs as
the `postgres` role, which bypasses the trigger's `auth.uid()` check, so
it works for bootstrapping the first officer.

---

## Content: the blog

Posts live in `content/blog/*.mdx`. Each file is an MDX document with YAML
frontmatter:

```mdx
---
title: My Post Title
date: 2026-04-24
author: Author Name
excerpt: One-sentence summary for the index page.
featuredImage: /blog/optional-image.jpg
tags: [optional, tags]
---

MDX content here. Full React components are supported.
```

Drop a new `.mdx` file in `content/blog/` and it shows up on `/blog` —
no config changes needed.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Set the three environment variables under **Settings → Environment Variables**.
4. Under **Supabase → Authentication → URL Configuration**, add your Vercel
   domain to the redirect-URL allowlist (and update **Site URL** for prod).
5. Deploy.

Vercel auto-detects Next.js; no build overrides are needed.

---

## Project layout

```
app/
  (public)/           # Pages with the public marketing nav/footer
  (auth)/             # Login/signup/password-reset screens (minimal chrome)
  auth/callback       # OAuth code-exchange
  auth/confirm        # token_hash email-verification endpoint
  dashboard/          # Authenticated area (proxy-protected)
  admin/              # Officer/admin-only area (proxy + layout double-gated)
  actions/auth.ts     # Server actions: login, signup, logout, reset
  layout.tsx          # Root: fonts, Toaster
  globals.css         # Tailwind v4 + shadcn theme (Aggie maroon primary)
components/
  ui/                 # shadcn primitives (base-nova style)
  auth/               # Auth forms + logout button + dashboard toast
  nav/                # Top nav, mobile menu, user menu
  footer.tsx
lib/
  supabase/{client,server,middleware}.ts
  auth/require-role.ts
  blog.ts             # MDX listing (fs + gray-matter)
  types.ts            # UserRole, Profile
  validations.ts      # Zod schemas
  utils.ts            # shadcn cn()
content/blog/         # MDX posts
supabase/migrations/  # SQL migrations
proxy.ts              # Next 16 proxy (formerly middleware.ts) — refreshes Supabase session + route gating
```

---

## Security notes

- **RLS first.** Middleware/proxy role checks are UX redirects. Real auth is
  enforced at the Postgres layer via RLS policies in the migration.
- **Role change protection** is a `BEFORE UPDATE` trigger, not a policy —
  RLS can't see OLD vs NEW per column. Users can update their own profile
  row freely except for `role`, which is blocked unless they're already
  officer/admin.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) is never imported in
  client code. Only use it from server code that specifically needs to
  bypass RLS (none required for the current scaffold).
