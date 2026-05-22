/**
 * Cookie options for Supabase clients so sessions are shared across
 * *.alphasightai.online subdomains (chat, info, about, …).
 *
 * In production we set `domain=.alphasightai.online` on auth cookies; a user
 * who logs in on chat is then logged in on info, about, and any future
 * subdomain. Browsers will refuse a Domain attribute for `localhost`, so we
 * skip it in dev and on Vercel preview URLs.
 *
 * Read once at module load; we don't try to be clever about per-request hosts.
 */

const ROOT_DOMAIN = 'alphasightai.online';

function shouldShareAcrossSubdomains(): boolean {
  // Only attach a Domain attribute when we're actually on the production root.
  // Vercel preview deployments live on vercel.app and must keep host-only cookies.
  if (process.env.NODE_ENV !== 'production') return false;
  const url = process.env.NEXT_PUBLIC_SITE_URL || '';
  return url.includes(ROOT_DOMAIN);
}

export function supabaseCookieOptions() {
  if (!shouldShareAcrossSubdomains()) return undefined;
  return {
    domain: `.${ROOT_DOMAIN}`,
    sameSite: 'lax' as const,
    secure: true,
    path: '/',
  };
}
