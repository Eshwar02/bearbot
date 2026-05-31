import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";
import { getRequestOrigin } from "@/lib/url/server-origin";

type SetAllCookies = (
  cookies: Array<{ name: string; value: string; options?: CookieOptions }>
) => void;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const redirectParam = searchParams.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/";

  if (code) {
    // Build the redirect response up-front so Supabase can write Set-Cookie
    // headers directly onto it. Buffering cookies and applying them at the end
    // misses any refresh that happens during getUser(), which is why the
    // browser arrives at "/" without a session and gets bounced to /login.
    const response = NextResponse.redirect(new URL(safeRedirect, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
      {
        cookieOptions: supabaseCookieOptions(),
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(newCookies: Parameters<SetAllCookies>[0]) {
            newCookies.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            newCookies.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Session exchange failed:", error);
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_failed", origin)
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const { data: existingPrefs } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!existingPrefs) {
          const { error: prefError } = await supabase
            .from("user_preferences")
            .insert({
              user_id: user.id,
              default_market: "US",
              theme: "dark",
              currency: "INR",
            });

          if (prefError) {
            console.error("[auth/callback] Failed to create user preferences:", prefError);
          }
        }
      } catch (error) {
        console.debug("[auth/callback] User profile sync skipped:", error);
      }
    }

    return response;
  }

  console.error("[auth/callback] Missing auth code");
  return NextResponse.redirect(
    new URL("/login?error=missing_code", origin)
  );
}
