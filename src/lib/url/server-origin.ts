import type { NextRequest } from "next/server";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

const PROD_APP_ORIGIN = "https://chat.alphasightai.online";

function isVercelHost(host: string): boolean {
  return host.endsWith(".vercel.app");
}

export function getRequestOrigin(request: NextRequest): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host") || "";
  const effectiveHost = forwardedHost || hostHeader;

  // On Vercel previews/internal URLs in prod we still want auth + redirects to
  // land on the canonical app origin so the session cookie ends up on the
  // correct domain.
  if (process.env.NODE_ENV === "production" && isVercelHost(effectiveHost)) {
    return PROD_APP_ORIGIN;
  }

  if (forwardedProto && forwardedHost) {
    return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  if (hostHeader) {
    const proto = forwardedProto || "https";
    return normalizeOrigin(`${proto}://${hostHeader}`);
  }

  return normalizeOrigin(request.nextUrl.origin);
}
