"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import type { StringKey } from "@/lib/i18n";

type EditableBungalow = {
  id: string;
  name: string;
  district: string;
  town: string;
  address: string | null;
  description: string | null;
  contact_phone: string | null;
  booking_url: string | null;
  facebook_url: string | null;
  rooms_count: number | null;
  max_guests: number | null;
  ac_type: string | null;
};

export default function BungalowSuggestionForm({ bungalow }: { bungalow: EditableBungalow }) {
  const [signedIn, setSignedIn] = useState(false);
  const [values, setValues] = useState({
    name: bungalow.name,
    district: bungalow.district,
    town: bungalow.town,
    address: bungalow.address ?? "",
    description: bungalow.description ?? "",
    contact_phone: bungalow.contact_phone ?? "",
    booking_url: bungalow.booking_url ?? "",
    facebook_url: bungalow.facebook_url ?? "",
    rooms_count: bungalow.rooms_count != null ? String(bungalow.rooms_count) : "",
    max_guests: bungalow.max_guests != null ? String(bungalow.max_guests) : "",
    ac_type: bungalow.ac_type ?? "",
  });
  const [message, setMessage] = useState("");
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const changes = Object.fromEntries(Object.entries(values).filter(([key, value]) => {
      const current = bungalow[key as keyof EditableBungalow];
      return value.trim() !== String(current ?? "").trim();
    }).map(([key, value]) => [key, value.trim() || null]));
    if (Object.keys(changes).length === 0) {
      setMessage("There are no changes to suggest.");
      return;
    }

    if (Object.values(changes).some((value) => typeof value === "string" && value.length > 2000)) {
      setMessage("Each suggested field must be 2,000 characters or fewer.");
      return;
    }
    for (const key of ["rooms_count", "max_guests"] as const) {
      const value = changes[key];
      if (typeof value === "string" && !/^[0-9]+$/.test(value)) {
        setMessage("Number of rooms and max guests must be whole numbers.");
        return;
      }
    }
    setSaving(true);
    setMessage("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please log in before suggesting an edit.");
      const { error } = await supabase.from("bungalow_suggestions").insert({
        bungalow_id: bungalow.id,
        user_id: user.id,
        proposed_changes: changes,
        status: "pending",
      });
      if (error) throw error;
      setMessage("Suggestion sent for admin review.");
    } catch (error) {
      setMessage(error instanceof Error ? `Unable to send suggestion: ${error.message}` : "Unable to send suggestion.");
    } finally {
      setSaving(false);
    }
  }

  if (!signedIn) return <div className="rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-5 text-sm text-[#718077] dark:text-[#9db0a2]">{t("s_signin")} <Link href="/login" className="font-semibold text-[#315c46] dark:text-[#7fb894] underline">{t("login")}</Link></div>;

  const fields: { key: keyof typeof values; label: StringKey; multiline?: boolean; kind?: "number" | "ac" }[] = [
    { key: "name", label: "f_name" },
    { key: "district", label: "f_district" },
    { key: "town", label: "f_town" },
    { key: "address", label: "f_address" },
    { key: "description", label: "f_description", multiline: true },
    { key: "contact_phone", label: "f_phone" },
    { key: "booking_url", label: "f_booking_url" },
    { key: "facebook_url", label: "f_facebook_url" },
    { key: "rooms_count", label: "f_rooms", kind: "number" },
    { key: "max_guests", label: "f_guests", kind: "number" },
    { key: "ac_type", label: "f_ac", kind: "ac" },
  ];

  return <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
    <p className="text-sm leading-6 text-[#718077] dark:text-[#9db0a2] sm:col-span-2">{t("s_intro")}</p>
    {fields.map(({ key, label, multiline, kind }) => (
      <label key={key} className={`grid gap-1 text-sm font-medium ${multiline ? "sm:col-span-2" : ""}`}>{t(label)}
        {kind === "ac" ? (
          <select className="rounded-xl border border-[#dce3dc] dark:border-[#243830] bg-white dark:bg-[#121a15] p-3 font-normal" value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}>
            <option value="">{t("f_not_specified")}</option>
            <option value="AC">{t("ac_ac")}</option>
            <option value="Non-AC">{t("ac_nonac")}</option>
            <option value="Mixed">{t("ac_mixed")}</option>
          </select>
        ) : multiline ? (
          <textarea maxLength={2000} className="rounded-xl border border-[#dce3dc] dark:border-[#243830] p-3 font-normal" rows={4} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
        ) : (
          <input maxLength={key === "booking_url" || key === "facebook_url" ? 2048 : 200} type={kind === "number" ? "number" : key === "booking_url" || key === "facebook_url" ? "url" : "text"} min={kind === "number" ? 0 : undefined} className="rounded-xl border border-[#dce3dc] dark:border-[#243830] p-3 font-normal" value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
        )}
      </label>
    ))}
    <button disabled={saving} className="w-fit rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{saving ? t("s_sending") : t("s_send")}</button>
    {message && <p className="text-sm text-[#52685a] dark:text-[#a9bcae] sm:col-span-2" role="status">{message}</p>}
  </form>;
}
