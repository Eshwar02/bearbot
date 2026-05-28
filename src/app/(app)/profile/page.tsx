import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/profile/profile-editor";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.display_name === "string" && meta.display_name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "User";

  const email = user.email || "No email available";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) || null;

  return (
    <ProfileEditor
      fullName={fullName}
      email={email}
      userId={user.id}
      createdAt={user.created_at ?? ""}
      emailVerified={!!user.email_confirmed_at}
      avatarUrl={avatarUrl}
    />
  );
}
