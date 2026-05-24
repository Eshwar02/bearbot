"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppOrigin } from "@/lib/url/client-origin";
import { SignInPage } from "@/components/ui/sign-in-flow-1";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  async function handleLogin(email: string, password: string) {
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      return { ok: false, error: signInError.message };
    }
    return { ok: true };
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const appOrigin = getBrowserAppOrigin();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appOrigin}/auth/callback`,
          scopes: "openid email profile",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (oauthError) {
        setGoogleLoading(false);
      }
    } catch {
      setGoogleLoading(false);
    }
  }

  function handleSuccess() {
    router.push('/');
    router.refresh();
  }

  return (
    <SignInPage
      onLogin={handleLogin}
      onGoogleLogin={handleGoogleLogin}
      onSuccess={handleSuccess}
      loading={loading}
      googleLoading={googleLoading}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginPageContent />
    </Suspense>
  );
}
