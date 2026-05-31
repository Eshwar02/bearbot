"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Upload, RefreshCw, X, Check, Loader2 } from "lucide-react";

const DICEBEAR_STYLES = [
  "adventurer",
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "micah",
  "miniavs",
  "notionists",
  "personas",
  "pixel-art",
] as const;

type DicebearStyle = (typeof DICEBEAR_STYLES)[number];

function dicebearUrl(style: DicebearStyle, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

async function resizeToDataUrl(file: File, max = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(max / bitmap.width, max / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/webp", 0.85)
  );
  if (!blob) throw new Error("Failed to encode image");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  seedFallback: string;
  onSaved: (url: string) => void;
}

export function AvatarEditModal({
  open,
  onClose,
  currentAvatar,
  seedFallback,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<"avatars" | "upload">("avatars");
  const [seed, setSeed] = useState(seedFallback);
  const [pickedUrl, setPickedUrl] = useState<string | null>(currentAvatar);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPickedUrl(currentAvatar);
      setSeed(seedFallback);
      setTab("avatars");
    }
  }, [open, currentAvatar, seedFallback]);

  if (!open) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    try {
      const dataUrl = await resizeToDataUrl(file, 256);
      setPickedUrl(dataUrl);
      setTab("upload");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read image.");
    }
  };

  const handleSave = async () => {
    if (!pickedUrl) {
      toast.error("Pick an avatar first.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: pickedUrl },
    });
    if (!error) {
      await supabase.auth.refreshSession();
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile picture updated.");
    onSaved(pickedUrl);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-borderSubtle bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-borderSubtle px-5 py-3">
          <h3 className="text-base font-semibold text-primary">Change profile picture</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-borderSubtle px-3 pt-2">
          <button
            onClick={() => setTab("avatars")}
            className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "avatars"
                ? "bg-elevated text-primary"
                : "text-muted hover:text-primary"
            }`}
          >
            Avatars
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "upload"
                ? "bg-elevated text-primary"
                : "text-muted hover:text-primary"
            }`}
          >
            Upload
          </button>
        </div>

        <div className="p-5">
          {tab === "avatars" ? (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Seed (any text)"
                  className="flex-1 rounded-lg border border-borderStrong bg-input px-3 py-1.5 text-sm text-primary outline-none focus:border-accent-brand"
                />
                <button
                  onClick={() => setSeed(Math.random().toString(36).slice(2, 10))}
                  className="inline-flex items-center gap-1 rounded-lg border border-borderSubtle bg-input px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-elevated"
                  title="Randomize"
                >
                  <RefreshCw size={13} />
                  Randomize
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {DICEBEAR_STYLES.map((style) => {
                  const url = dicebearUrl(style, seed || seedFallback);
                  const selected = pickedUrl === url;
                  return (
                    <button
                      key={style}
                      onClick={() => setPickedUrl(url)}
                      className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-elevated transition-all ${
                        selected
                          ? "border-accent-brand ring-2 ring-accent-brand/40"
                          : "border-borderSubtle hover:border-accent-brand/60"
                      }`}
                      title={style}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={style}
                        className="h-full w-full object-cover"
                      />
                      {selected && (
                        <span className="absolute right-1 top-1 rounded-full bg-accent-brand p-0.5 text-white">
                          <Check size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-borderSubtle bg-elevated">
                {pickedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pickedUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">No image selected</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-borderSubtle bg-elevated px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-borderSubtle"
              >
                <Upload size={14} />
                Choose image
              </button>
              <p className="text-center text-xs text-muted">
                JPG, PNG, or WebP. Max 5 MB. Resized to 256×256.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-borderSubtle px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-borderSubtle bg-canvas px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-elevated"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !pickedUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-brand px-4 py-1.5 text-sm font-semibold text-inverse transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
