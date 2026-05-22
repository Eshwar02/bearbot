function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export function getBrowserAppOrigin(): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  return normalizeOrigin(window.location.origin);
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
