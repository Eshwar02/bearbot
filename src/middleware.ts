import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getRequestOrigin } from "@/lib/url/server-origin";

type SetAllCookies = (
  cookies: Array<{ name: string; value: string; options?: CookieOptions }>
) => void;

// Guests are allowed on the chat page ("/") so they can try the product. The
// chat API enforces its own 5-prompt cap for unauthenticated callers. Every
// other in-app surface (portfolio, watchlist, brief, settings, profile) still
// gates on auth and bounces to /login.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback", "/api/daily-brief", "/api/market-stream", "/api/quotes", "/info", "/about", "/privacy", "/terms", "/disclaimer", "/contact"];

// Search-engine + verification crawlers. When one of these hits a protected
// page we rewrite to the marketing landing instead of redirecting to /login,
// so the bot sees crawlable HTML with our verification meta tags in <head>.
const CRAWLER_UA_REGEX = /bingbot|bingpreview|msnbot|googlebot|google-inspectiontool|duckduckbot|yandexbot|baiduspider|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot|pinterestbot|ahrefsbot|semrushbot|mj12bot|petalbot/i;

function isCrawler(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  return CRAWLER_UA_REGEX.test(ua);
}

// Marketing subdomains: when a request lands on info./about./… and asks for
// the bare root, redirect to the matching route on the main app origin before
// the auth gate runs. This avoids serving any page on the broken subdomain
// host and keeps auth/session state on the same origin as the chat app.
const SUBDOMAIN_ROUTES: Record<string, string> = {
  "info.alphasightai.online": "/info",
  "about.alphasightai.online": "/about",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiPath = pathname.startsWith("/api/");

  // Host-based root rewrite for marketing subdomains. Only the literal "/" is
  // remapped so that /login, /api/*, and asset paths on those subdomains keep
  // working normally.
  const host = request.headers.get("host") || "";
  const subdomainTarget = SUBDOMAIN_ROUTES[host];
  if (subdomainTarget) {
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.nextUrl.origin;
    const redirectUrl = new URL(pathname === "/" ? subdomainTarget : pathname, appOrigin);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  let response: NextResponse;
  try {
    // First, refresh the session (updates cookies)
    response = await updateSession(request);
  } catch (error) {
    console.error("[middleware] session refresh failed", error);
    // If it's an auth error (like invalid refresh token), get a fresh response
    // that has the cookies cleared by updateSession
    if (error instanceof Error && error.message.includes('Refresh Token Not Found')) {
      response = await updateSession(request);
    } else {
      // Never block API routes at middleware layer; API handlers enforce auth.
      if (isApiPath) {
        return NextResponse.next({ request });
      }
      response = NextResponse.next({ request });
    }
  }

  // API routes should not be redirected by middleware.
  // Their handlers return JSON 401/500 responses as needed.
  if (isApiPath) {
    return response;
  }

  // Build a lightweight Supabase client from the *response* cookies
  // so we read the freshly-refreshed tokens.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let user = null;
  try {
    const {
      data: { user: resolvedUser },
    } = await supabase.auth.getUser();
    user = resolvedUser;
  } catch (error) {
    console.error("[middleware] auth user check failed", error);
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // Unauthenticated user trying to access protected route
  if (!user && !isPublicPath) {
    // Crawlers must get crawlable HTML, not a /login redirect — otherwise
    // verification + indexing fails. Rewrite (200) to /info so Bing/Google
    // see the marketing page with verification meta tags in <head>.
    if (isCrawler(request)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/info";
      return NextResponse.rewrite(rewriteUrl);
    }
    const origin = getRequestOrigin(request);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting login or signup — send them home
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", getRequestOrigin(request)));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|sw.js|BingSiteAuth.xml|browserconfig.xml|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
