function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

const PROD_ROOT = "alphasightai.online";
const PROD_APP_ORIGIN = "https://chat.alphasightai.online";
const PROD_INSIGHTS_ORIGIN = "https://insights.alphasightai.online";

// Subdomains that host first-class app surfaces (not just marketing pages).
// Auth + cookies are shared across all of them via the wildcard
// `.alphasightai.online` cookie; we therefore keep traffic on its origin
// instead of bouncing every page back to chat.
const PRODUCT_HOSTS = new Set([
  "chat.alphasightai.online",
  "insights.alphasightai.online",
]);

function isProdHost(host: string): boolean {
  return host.endsWith(`.${PROD_ROOT}`) || host === PROD_ROOT;
}

function isVercelHost(host: string): boolean {
  return host.endsWith(".vercel.app");
}

export function getBrowserAppOrigin(): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // If the browser landed on a Vercel preview/internal URL but this is the
    // production app, force OAuth + post-login redirects to the canonical
    // chat.alphasightai.online so the session cookie ends up on the right
    // domain. Without this the cookie is written on vercel.app and the user
    // returns to the custom domain as a guest (the "5 free prompts" state).
    if (isVercelHost(host)) {
      return PROD_APP_ORIGIN;
    }
    // First-class product subdomains keep their origin — they share the same
    // wildcard auth cookie so the session works there directly.
    if (PRODUCT_HOSTS.has(host)) {
      return normalizeOrigin(window.location.origin);
    }
    // Marketing/legacy subdomains (info., about., …) normalize back to chat so
    // their auth callbacks land on the canonical app origin.
    if (isProdHost(host) && host !== "chat.alphasightai.online") {
      return PROD_APP_ORIGIN;
    }
    return normalizeOrigin(window.location.origin);
  }

  return PROD_APP_ORIGIN;
}

/**
 * Origin of the chat product. Used when a non-chat surface (e.g. insights)
 * needs to link back into the conversational app.
 */
export function getChatOrigin(): string {
  if (process.env.NEXT_PUBLIC_CHAT_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_CHAT_URL);
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host.endsWith(".localhost") || host.startsWith("127.")) {
      // In local dev every product subdomain runs against the same Next server,
      // so the chat surface is just the bare localhost origin.
      const port = window.location.port ? `:${window.location.port}` : "";
      return normalizeOrigin(`${window.location.protocol}//localhost${port}`);
    }
  }
  return PROD_APP_ORIGIN;
}

/**
 * Origin of the company-analysis product. Used by chat (and other surfaces)
 * to deep-link to a ticker page.
 */
export function getInsightsOrigin(): string {
  if (process.env.NEXT_PUBLIC_INSIGHTS_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_INSIGHTS_URL);
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host.endsWith(".localhost") || host.startsWith("127.")) {
      const port = window.location.port ? `:${window.location.port}` : "";
      return normalizeOrigin(`${window.location.protocol}//insights.localhost${port}`);
    }
  }
  return PROD_INSIGHTS_ORIGIN;
}

/**
 * URL to a specific company's insights page. Centralizes the deep-link format
 * so chat ticker chips, portfolio rows, and sidebar links stay consistent.
 */
export function getInsightsCompanyUrl(symbol: string): string {
  const trimmed = symbol.trim().toUpperCase();
  return `${getInsightsOrigin()}/${encodeURIComponent(trimmed)}`;
}

/**
 * Build the URL to send users to after a successful login.
 *
 * Login can happen on multiple subdomains (info.alphasightai.online,
 * chat.alphasightai.online, etc.) but the product itself lives on `chat.`.
 * After auth we always cross over to the app origin, never stay on a
 * marketing subdomain.
 *
 * The optional `redirect` param is the relative path the user was originally
 * trying to reach (e.g. /portfolio). We preserve it on top of the app origin
 * and reject anything that isn't a same-origin path.
 */
export function getPostLoginUrl(redirect?: string | null): string {
  const origin = getBrowserAppOrigin();
  const safePath =
    typeof redirect === "string" &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//")
      ? redirect
      : "/";
  return `${origin}${safePath}`;
}
