import type { NextRequest } from "next/server";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export function getRequestOrigin(request: NextRequest): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  // On Vercel, request.nextUrl.origin may return the internal deployment URL
  // (e.g. bearbot.vercel.app) instead of the custom domain. The Host header
  // always reflects what the browser actually sent, so prefer it as fallback.
  const host = request.headers.get("host");
  if (host) {
    const proto = forwardedProto || "https";
    return normalizeOrigin(`${proto}://${host}`);
  }

  return normalizeOrigin(request.nextUrl.origin);
}
