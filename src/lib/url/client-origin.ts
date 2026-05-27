function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

const PROD_ROOT = "alphasightai.online";
const PROD_APP_ORIGIN = "https://chat.alphasightai.online";

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
    // On any alphasightai.online subdomain (info., about., …) the app itself
    // lives on chat. — normalize so auth callbacks always come back there.
    if (isProdHost(host) && host !== "chat.alphasightai.online") {
      return PROD_APP_ORIGIN;
    }
    return normalizeOrigin(window.location.origin);
  }

  return PROD_APP_ORIGIN;
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
