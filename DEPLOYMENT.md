# Deployment & subdomain routing

This Next.js app serves the entire `alphasightai.online` family of subdomains from a single Vercel project.

## Routing map

| URL | Serves |
|---|---|
| `alphasightai.online` | 301 → `chat.alphasightai.online` |
| `www.alphasightai.online` | 301 → `chat.alphasightai.online` |
| `chat.alphasightai.online` | The product (root of this app, `/`) |
| `info.alphasightai.online` | Marketing landing page (`/info`) |
| `about.alphasightai.online` | About page (`/about` — add when ready) |

Rewrites and redirects live in `next.config.ts`. Auth cookies are shared across `*.alphasightai.online` via `src/lib/supabase/cookie-options.ts`.

## One-time setup

### 1. Vercel domains

In the Vercel project → Settings → Domains, add each subdomain:

- `alphasightai.online`
- `www.alphasightai.online`
- `chat.alphasightai.online`
- `info.alphasightai.online`

Vercel will print the DNS target for each. Apex (`alphasightai.online`) needs an A record; subdomains need a CNAME to `cname.vercel-dns.com`.

Optionally add `*.alphasightai.online` as a wildcard domain — then new subdomains need only a `next.config.ts` change, no DNS step.

### 2. DNS at your registrar

```
A      @       76.76.21.21
CNAME  www     cname.vercel-dns.com
CNAME  chat    cname.vercel-dns.com
CNAME  info    cname.vercel-dns.com
# Optional wildcard so any future subdomain resolves automatically:
CNAME  *       cname.vercel-dns.com
```

(The apex `A` IP is whatever Vercel shows you — `76.76.21.21` is current at time of writing but check the Vercel dashboard.)

### 3. Environment variables

In Vercel → Settings → Environment Variables (Production):

```
NEXT_PUBLIC_SITE_URL=https://chat.alphasightai.online
```

That env var is what `src/lib/supabase/cookie-options.ts` checks to decide whether to attach `Domain=.alphasightai.online` to auth cookies. Without it, sessions won't span subdomains.

Also set the existing Supabase + provider keys you already use (`NEXT_PUBLIC_SUPABASE_URL`, etc.).

### 4. Supabase auth allow-list

In Supabase dashboard → Authentication → URL Configuration, add to **Site URL** and **Redirect URLs**:

```
https://chat.alphasightai.online
https://chat.alphasightai.online/auth/callback
https://info.alphasightai.online
```

Otherwise OAuth redirects from non-chat subdomains will fail.

## Adding a new subdomain (3 steps)

Say you want `pricing.alphasightai.online`:

1. **Create the route**: `src/app/pricing/page.tsx`.
2. **Add a rewrite** in `next.config.ts`:
   ```ts
   { source: '/', has: [{ type: 'host', value: 'pricing.alphasightai.online' }], destination: '/pricing' },
   ```
3. **DNS**: if you set up the wildcard CNAME above, do nothing. Otherwise add `CNAME pricing → cname.vercel-dns.com` and add the domain in Vercel.

Deploy. Done.

## Local development

Subdomain rewrites are skipped in dev (no `Host: info.alphasightai.online` header on `localhost:3000`). Visit pages by their internal path:

- `http://localhost:3000/` — product
- `http://localhost:3000/info` — landing page
- `http://localhost:3000/about` — about

To test subdomain routing locally, edit `/etc/hosts`:

```
127.0.0.1 info.alphasightai.local chat.alphasightai.local
```

…then temporarily add those `.local` hosts to the `rewrites()` block.

## Gotchas

- **Cookies don't share on Vercel preview URLs.** Preview deploys live at `*.vercel.app` so the `.alphasightai.online` domain attribute is intentionally not set there. Test cross-subdomain auth on production only.
- **The 301 redirect from apex is permanent.** Browsers cache permanent redirects aggressively. If you ever want apex to serve content directly, you'll need a hard refresh / cache bust.
- **OAuth callback URL is fixed.** Whichever subdomain you point Supabase's OAuth callback at is the one users land on after sign-in. Currently that's `chat.`.
