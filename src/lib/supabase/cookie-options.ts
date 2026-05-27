/**
 * Cookie options for Supabase clients so sessions are shared across
 * *.alphasightai.online subdomains (chat, info, about, …).
 *
 * In production we set `domain=.alphasightai.online` on auth cookies; a user
 * who logs in on chat is then logged in on info, about, and any future
 * subdomain. Browsers will refuse a Domain attribute for `localhost` or
 * `vercel.app`, so we skip it in those cases and return host-only cookies.
 *
 * Detection prefers the current hostname (browser) and falls back to NODE_ENV
 * + the configured site URL on the server, so a missing NEXT_PUBLIC_SITE_URL
 * at build time on Vercel no longer drops us back to host-only cookies on
 * the production custom domain.
 */

const ROOT_DOMAIN = 'alphasightai.online';

function hostnameLooksLikeProd(host: string): boolean {
  return host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`);
}

function shouldShareAcrossSubdomains(): boolean {
  // Browser: trust the actual page hostname. Setting domain=.alphasightai.online
  // on any other origin (vercel.app, localhost) would have the browser drop the
  // cookie entirely.
  if (typeof window !== 'undefined') {
    return hostnameLooksLikeProd(window.location.hostname);
  }
  // Server: env-based detection. We can't see the request host here, so only
  // attach Domain when the configured site URL clearly points at production.
  // Requests that arrive on a vercel.app host in production are redirected to
  // the canonical domain by middleware before any cookie is written.
  if (process.env.NODE_ENV !== 'production') return false;
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    '';
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
