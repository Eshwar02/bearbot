import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPasswordChangedConfirmationEmail } from "@/lib/email-sender";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const emailSent = await sendPasswordChangedConfirmationEmail(user.email);

  if (!emailSent) {
    return NextResponse.json(
      { error: "Failed to send confirmation email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
