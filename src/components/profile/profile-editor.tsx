"use client";

import { toast } from "sonner";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Crown,
  Pencil,
  BadgeCheck,
  Check,
  X,
  KeyRound,
} from "lucide-react";
import { AvatarEditModal } from "./avatar-edit-modal";

interface ProfileEditorProps {
  fullName: string;
  email: string;
  userId: string;
  createdAt: string;
  emailVerified: boolean;
  avatarUrl: string | null;
}

export default function ProfileEditor({
  fullName,
  email,
  createdAt,
  emailVerified,
  avatarUrl,
}: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(fullName);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);

  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB")
    : "Unknown";
  const supabase = createClient();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(email);

  const [isEmailVerified, setIsEmailVerified] = useState(emailVerified);

  const [isSaving, setIsSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: trimmed,
        full_name: trimmed,
      },
    });

    if (!error) {
      await supabase.auth.refreshSession();
    }

    setIsSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDisplayName(trimmed);
    setIsEditingName(false);
    toast.success("Name updated.");
  };
    const handleSaveEmail = async () => {
          const trimmedEmail = emailValue.trim();

          if (!trimmedEmail) {
            toast.error("Email address cannot be empty.");
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailRegex.test(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
          }

          if (trimmedEmail.toLowerCase() === email.toLowerCase()) {
            toast.info("This is already your current email address.");
            setIsEditingEmail(false);
            return;
          }

          setIsSaving(true);

          const { error } = await supabase.auth.updateUser({
            email: trimmedEmail,
          });

          setIsSaving(false);

          if (error) {
            const message = error.message.toLowerCase();

            if (message.includes("already been registered")) {
              toast.error("This email address is already in use.");
            } else if (message.includes("rate limit")) {
              toast.error("Too many verification emails sent. Please try again later.");
            } else if (
              message.includes("invalid format") ||
              message.includes("unable to validate email address")
            ) {
              toast.error("Please enter a valid email address.");
            } else {
              toast.error(error.message);
            }

            return;
          }

          toast.success(
            "Verification request submitted. Please check your inbox and spam folder."
          );

          setEmailValue(trimmedEmail);
          setIsEmailVerified(false);
          setIsEditingEmail(false);
        };

        const handleResendVerification = async () => {
          setIsSaving(true);

          const { error } = await supabase.auth.updateUser({
            email: emailValue.trim(),
          });

          setIsSaving(false);

          if (error) {
            const message = error.message.toLowerCase();

            if (message.includes("rate limit")) {
              toast.error("Too many verification emails sent. Please try again later.");
            } else {
              toast.error(error.message);
            }

            return;
          }

          toast.success("Verification email sent successfully.");
        };
        const handleChangePassword = async () => {
            setIsSaving(true);

            const { error } = await supabase.auth.resetPasswordForEmail(
              emailValue.trim(),
              {
                redirectTo: `${window.location.origin}/reset-password`,
              }
            );

            setIsSaving(false);

            if (error) {
              const message = error.message.toLowerCase();

              if (message.includes("rate limit")) {
                toast.error(
                  "Too many password reset emails sent. Please try again later."
                );
              } else {
                toast.error(error.message);
              }

              return;
            }

            toast.success(
              "Password reset email sent. Please check your inbox and spam folder."
            );
          };
  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <User className="h-7 w-7 text-accent-green" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">Profile</h1>
          </div>

          <p className="mt-1 text-sm text-muted">
            Manage your AlphaSight account information
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-borderSubtle bg-elevated shadow-lg">
          <div className="flex flex-col gap-4 border-b border-borderSubtle p-5 md:flex-row md:items-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-white shadow-lg">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={() => setAvatarModalOpen(true)}
                className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-elevated bg-accent-brand text-inverse shadow-md transition-transform hover:scale-105"
                aria-label="Edit profile picture"
                title="Edit profile picture"
              >
                <Pencil size={12} />
              </button>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-primary">
                {displayName}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {email}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-accent-green/20 bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
              <Crown className="h-3.5 w-3.5" />
              AlphaSight
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <InfoCard
            icon={<User className="h-4 w-4 text-accent-green" />}
            label="Full Name"
            value={
                isEditingName ? (
                <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="w-full rounded-lg border border-borderStrong bg-input px-3 py-2 text-base text-primary outline-none focus:border-accent-green"
                />
                ) : (
                displayName
                )
            }
            action={
                isEditingName ? (
                <div className="flex items-center gap-1">
                    <button
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-lg border border-accent-green/20 bg-accent-green/10 px-2 py-1 text-[11px] font-medium text-accent-green hover:bg-accent-green/20 disabled:opacity-50"
                    >
                    <Check className="h-3 w-3" />
                    {isSaving ? "Saving..." : "Save"}
                    </button>

                    <button
                    onClick={() => {
                        setNameValue(displayName);
                        setIsEditingName(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500/20"
                    >
                    <X className="h-3 w-3" />
                    Cancel
                    </button>
                </div>
                ) : (
                <button
                    onClick={() => setIsEditingName(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-borderSubtle bg-input px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-borderSubtle"
                >
                    <Pencil className="h-3 w-3" />
                    Edit
                </button>
                )
            }
            />

            <InfoCard
            icon={<Mail className="h-4 w-4 text-accent-cyan" />}
            label="Email Address"
            value={
                isEditingEmail ? (
                <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="w-full rounded-lg border border-borderStrong bg-input px-3 py-2 text-base text-primary outline-none focus:border-accent-cyan"
                />
                ) : (
                emailValue
                )
            }
            action={
                isEditingEmail ? (
                <div className="flex items-center gap-1">
                    <button
                    onClick={handleSaveEmail}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-lg border border-accent-green/20 bg-accent-green/10 px-2 py-1 text-[11px] font-medium text-accent-green hover:bg-accent-green/20 disabled:opacity-50"
                    >
                    <Check className="h-3 w-3" />
                    {isSaving ? "Saving..." : "Save"}
                    </button>

                    <button
                    onClick={() => {
                        setEmailValue(email);
                        setIsEditingEmail(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500/20"
                    >
                    <X className="h-3 w-3" />
                    Cancel
                    </button>
                </div>
                ) : (
                <button
                    onClick={() => setIsEditingEmail(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-borderSubtle bg-input px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-borderSubtle"
                >
                    <Pencil className="h-3 w-3" />
                    Edit
                </button>
                )
            }
            />

            <InfoCard
              icon={<Calendar className="h-4 w-4 text-amber-400" />}
              label="Member Since"
              value={memberSince}
            />

            <InfoCard
              icon={<ShieldCheck className="h-4 w-4 text-accent-green" />}
              label="Email Status"
              value={isEmailVerified ? "Verified" : "Pending Verification"}
              valueClassName={
                isEmailVerified ? "text-accent-green" : "text-amber-400"
              }
              action={
                !isEmailVerified ? (
                  <button
                    onClick={handleResendVerification}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-500 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <BadgeCheck className="h-3 w-3" />
                    {isSaving ? "Sending..." : "Verify"}
                  </button>
                ) : undefined
              }
            />

            <InfoCard
              icon={<Crown className="h-4 w-4 text-yellow-500" />}
              label="Current Plan"
              value="AlphaSight Basic"
              valueClassName="text-accent-green"
            />
            <InfoCard
              icon={<KeyRound className="h-4 w-4 text-red-500" />}
              label="Security"
              value="Change Password"
              valueClassName="text-muted"
              action={
                <button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <KeyRound className="h-3 w-3" />
                  {isSaving ? "Sending..." : "Change Password"}
                </button>
              }
            />
          </div>
        </div>
      </div>

      <AvatarEditModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={avatar}
        seedFallback={displayName || email || "user"}
        onSaved={(url) => setAvatar(url)}
      />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  mono = false,
  action,
  valueClassName = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  action?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-borderSubtle bg-elevated p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </span>
        </div>

        {action}
      </div>

      <p
        className={`font-semibold text-primary ${valueClassName} ${
          mono
            ? "break-all font-mono text-xs md:text-sm"
            : "text-base md:text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
