/**
 * Tiny CORS helper for cross-subdomain calls between the insights and chat
 * surfaces. The two surfaces share a wildcard `.alphasightai.online` auth
 * cookie, so cross-origin fetches that need to carry credentials must echo
 * `Access-Control-Allow-Origin` with the exact request origin (NOT `*`) and
 * include `Access-Control-Allow-Credentials: true`.
 *
 * Usage:
 *   import { applyInsightsCors, corsPreflightResponse } from "@/lib/api/cors";
 *
 *   export async function OPTIONS(req: NextRequest) {
 *     return corsPreflightResponse(req);
 *   }
 *
 *   export async function GET(req: NextRequest) {
 *     const res = NextResponse.json({...});
 *     return applyInsightsCors(req, res);
 *   }
 */
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set<string>([
  "https://insights.alphasightai.online",
  "https://chat.alphasightai.online",
]);

const ALLOWED_ORIGIN_REGEX = [
  // Localhost dev — match both insights.localhost / chat.localhost and any port.
  /^https?:\/\/(insights|chat)\.localhost(?::\d+)?$/i,
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
];

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return ALLOWED_ORIGIN_REGEX.some((r) => r.test(origin));
}

/**
 * Adds CORS headers for cross-origin portfolio calls when the request
 * `Origin` matches an allowed insights / chat surface. No-op otherwise so
 * same-origin and unrelated callers are unaffected.
 */
export function applyInsightsCors(
  req: NextRequest,
  res: NextResponse,
): NextResponse {
  const origin = req.headers.get("origin") ?? "";
  if (!isAllowedOrigin(origin)) return res;

  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.append("Vary", "Origin");
  return res;
}

/**
 * Build an OPTIONS preflight response for the same set of origins handled
 * by `applyInsightsCors`. Returns 204 No Content with the CORS headers; if
 * the origin is not allowed we still 204 but omit the allow headers so the
 * browser blocks the call as expected.
 */
export function corsPreflightResponse(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin") ?? "";
  const reqMethod = req.headers.get("access-control-request-method") ?? "GET, POST, PUT, DELETE, OPTIONS";
  const reqHeaders = req.headers.get("access-control-request-headers") ?? "content-type, authorization";

  const res = new NextResponse(null, { status: 204 });
  if (!isAllowedOrigin(origin)) return res;

  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", reqMethod);
  res.headers.set("Access-Control-Allow-Headers", reqHeaders);
  res.headers.set("Access-Control-Max-Age", "600");
  res.headers.append("Vary", "Origin");
  return res;
}
