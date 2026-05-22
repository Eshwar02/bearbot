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

  return normalizeOrigin(request.nextUrl.origin);
}
