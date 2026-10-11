"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BookmarkButtonProps = {
  bungalowId: string;
  initialSaved?: boolean;
  variant?: "overlay" | "pill";
};

export default function BookmarkButton({ bungalowId, initialSaved = false, variant = "overlay" }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // Keep in sync when the parent finishes loading the user's bookmarks.
  // (Adjusted during render per React docs, instead of setState in an effect.)
  const [prevInitial, setPrevInitial] = useState(initialSaved);
  if (prevInitial !== initialSaved) {
    setPrevInitial(initialSaved);
    setSaved(initialSaved);
  }

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("bungalow_id", bungalowId);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, bungalow_id: bungalowId });
        if (error) throw error;
        setSaved(true);
      }
    } catch (toggleError) {
      console.error("Unable to update saved bungalows:", toggleError);
    } finally {
      setBusy(false);
    }
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${saved ? "border-[#244f3d] bg-[#244f3d] text-white dark:border-[#3d7a5c] dark:bg-[#3d7a5c]" : "border-[#dce3dc] hover:bg-[#f5f6f1] dark:border-[#243830] dark:hover:bg-[#182219]"}`}
      >
        <span aria-hidden="true" className="text-base leading-none">{saved ? "♥" : "♡"}</span>
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved bungalows" : "Save this bungalow"}
      title={saved ? "Remove from saved bungalows" : "Save this bungalow"}
      className={`grid h-10 w-10 place-items-center rounded-full text-lg shadow-md backdrop-blur transition hover:scale-105 disabled:opacity-60 ${saved ? "bg-[#244f3d] text-white dark:bg-[#3d7a5c]" : "bg-white/90 text-[#244f3d] dark:bg-[#121a15]/90 dark:text-[#e9f1ea]"}`}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
    </button>
  );
}
