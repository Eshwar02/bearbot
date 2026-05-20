"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppOrigin } from "@/lib/url/client-origin";
import { SignUpPage } from "@/components/ui/sign-up-flow-1";

function SignupPageContent() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleSignup(fullName: string, email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const appOrigin = getBrowserAppOrigin();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${appOrigin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError(null);
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
        setError(oauthError.message || "Failed to sign up with Google");
        setGoogleLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setGoogleLoading(false);
    }
  }

  return (
    <SignUpPage
      onSignup={handleSignup}
      onGoogleSignup={handleGoogleSignup}
      error={error}
      loading={loading}
      googleLoading={googleLoading}
      success={success}
    />
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignupPageContent />
    </Suspense>
  );
}
