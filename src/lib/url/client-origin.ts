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
