"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/lib/i18n";
import SiteLogo from "@/components/SiteLogo";
import PageNav from "@/components/PageNav";
import SafeImage from "@/components/SafeImage";
import { useLanguage } from "@/lib/i18n";

type Submission = {
  id: string;
  name: string;
  district: string;
  town: string;
  status: string;
  submitted_by: string | null;
  created_at: string;
  description: string | null;
  address: string | null;
  contact_phone: string | null;
  booking_url: string | null;
  facilities: string[] | null;
  image_urls: string[] | null;
  department_id: number | null;
  rooms_count: number | null;
  max_guests: number | null;
  ac_type: string | null;
};
type EditSuggestion = {
  id: string;
  bungalow_id: string;
  user_id: string;
  proposed_changes: Record<string, unknown>;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [analytics, setAnalytics] = useState({ pending: 0, approved: 0, contributors: 0 });
  const [departments, setDepartments] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const loadDashboard = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const allowed = await isAdminUser(user);
    setIsAdmin(allowed);
    if (!allowed) {
      setLoading(false);
      return;
    }

    const [listingResult, suggestionResult, analyticsResult, departmentResult] = await Promise.all([
      supabase.from("bungalows").select("id, name, district, town, status, submitted_by, created_at, description, address, contact_phone, booking_url, facilities, image_urls, department_id, rooms_count, max_guests, ac_type").eq("status", "pending").order("created_at", { ascending: false }).limit(100),
      supabase.from("bungalow_suggestions").select("id, bungalow_id, user_id, proposed_changes, status, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(100),
      supabase.rpc("get_admin_analytics"),
      supabase.from("departments").select("id, name"),
    ]);
    if (listingResult.error) {
      setMessage(`Unable to load dashboard data: ${listingResult.error.message}`);
      setLoading(false);
      return;
    }
    if (suggestionResult.error) setMessage(`Unable to load edit suggestions: ${suggestionResult.error.message}`);
    if (analyticsResult.error) {
      // The get_admin_analytics function may not be installed in the database
      // yet; fall back to direct counts so the cards still show real numbers.
      const [pendingRes, approvedRes, contribRes] = await Promise.all([
        supabase.from("bungalows").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("bungalows").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("bungalows").select("submitted_by").not("submitted_by", "is", null).limit(5000),
      ]);
      if (!pendingRes.error && !approvedRes.error) {
        setAnalytics({
          pending: pendingRes.count ?? 0,
          approved: approvedRes.count ?? 0,
          contributors: new Set((contribRes.data ?? []).map((row) => row.submitted_by)).size,
        });
      } else {
        setMessage(`Unable to load analytics: ${analyticsResult.error.message}`);
      }
    } else if (analyticsResult.data?.[0]) setAnalytics(analyticsResult.data[0]);
    const rows = (listingResult.data ?? []) as Submission[];
    setSubmissions(rows);
    setSuggestions((suggestionResult.data ?? []) as EditSuggestion[]);
    if (!departmentResult.error) {
      const map: Record<number, string> = {};
      for (const d of (departmentResult.data ?? []) as { id: number; name: string }[]) map[d.id] = d.name;
      setDepartments(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function approve(id: string) {
    setBusyId(id);
    setMessage("");
    const { error } = await supabase.from("bungalows").update({ status: "approved" }).eq("id", id);
    if (error) setMessage(`Unable to approve listing: ${error.message}`);
    else setMessage("Listing approved and published.");
    setBusyId("");
    await loadDashboard();
  }

  async function reviewSuggestion(suggestion: EditSuggestion, decision: "approved" | "rejected") {
    setBusyId(suggestion.id);
    setMessage("");
    const { error } = await supabase.rpc("admin_review_bungalow_suggestion", {
      suggestion_id: suggestion.id,
      decision,
    });
    setMessage(error ? `Unable to update suggestion: ${error.message}` : decision === "approved" ? "Suggested edits approved and applied." : "Suggestion rejected.");
    setBusyId("");
    await loadDashboard();
  }

  return (
    <main className="min-h-screen bg-[#fffefa] dark:bg-[#0b100e] text-[#23372f] dark:text-[#e9f1ea]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-9 lg:px-14">
        <Link href="/" className="flex items-center gap-3"><SiteLogo /><span className="text-lg font-bold tracking-[-.04em]">Circuit Bungalow Finder</span></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <PageNav />
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-9 lg:px-14">
        <div className="mb-8 pt-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">{t("a_kicker")}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">{t("a_title")}</h1><p className="mt-3 text-sm text-[#718077] dark:text-[#9db0a2]">{t("a_sub")}</p></div>

        {isAdmin === false && <section className="max-w-xl rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-7 shadow-sm"><h2 className="text-xl font-semibold">Admin access required</h2><p className="mt-2 text-sm leading-6 text-[#718077] dark:text-[#9db0a2]">Sign in with the verified admin email or an account assigned the admin role in Supabase.</p><Link href="/login" className="mt-5 inline-block rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-3 text-sm font-semibold text-white">Log in</Link></section>}

        {isAdmin && <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[{ label: t("a_pending"), value: analytics.pending, icon: "◷" }, { label: t("a_published"), value: analytics.approved, icon: "⌂" }, { label: t("a_contributors"), value: analytics.contributors, icon: "♧" }].map((item) => <article key={item.label} className="rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-6"><div className="flex items-center justify-between"><span className="text-sm font-medium text-[#718077] dark:text-[#9db0a2]">{item.label}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8eee5] dark:bg-[#1d2b22] text-lg text-[#315c46] dark:text-[#7fb894]">{item.icon}</span></div><p className="mt-5 text-4xl font-semibold tracking-[-.05em]">{loading ? "—" : item.value}</p></article>)}
          </div>

          <section className="mt-10 overflow-hidden rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ecece5] dark:border-[#223028] px-5 py-5 sm:px-7"><div><h2 className="text-xl font-semibold">{t("a_queue_title")}</h2><p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">{t("a_queue_sub")}</p></div><span className="rounded-full bg-[#f3f4ee] dark:bg-[#151f19] px-3 py-1.5 text-xs font-semibold text-[#52685a] dark:text-[#a9bcae]">{t("a_queue_count", { n: analytics.pending })}</span></div>
            {loading ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">Loading submissions…</p> : submissions.length === 0 ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">{t("a_no_submissions")}</p> : <div className="divide-y divide-[#ecece5] dark:divide-[#223028]">{submissions.map((item) => {
              const expanded = expandedId === item.id;
              const deptName = item.department_id != null ? departments[item.department_id] : null;
              return (
                <div key={item.id} className="px-5 py-5 sm:px-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.name}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${item.status === "approved" ? "bg-[#e8eee5] dark:bg-[#1d2b22] text-[#315c46] dark:text-[#7fb894]" : "bg-[#f5eddd] dark:bg-[#2b2417] text-[#8a6732] dark:text-[#d9b36c]"}`}>{item.status}</span></div><p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">{item.town}, {item.district} · Submitted {new Date(item.created_at).toLocaleDateString()}</p><p className="mt-1 truncate text-xs text-[#9aa69e] dark:text-[#6f8175]">Contribution ID: {item.id}</p></div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => setExpandedId(expanded ? "" : item.id)} aria-expanded={expanded} className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-5 py-2.5 text-sm font-semibold text-[#52685a] dark:text-[#a9bcae] hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">{expanded ? t("a_hide_details") : t("a_view_details")}</button>
                      {item.status === "pending" && <button onClick={() => void approve(item.id)} disabled={busyId === item.id} className="rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#183d2e] dark:hover:bg-[#2c5a44] disabled:opacity-60">{busyId === item.id ? t("a_approving") : t("a_approve")}</button>}
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-4 rounded-2xl bg-[#f8f9f5] dark:bg-[#151f19] p-5">
                      {item.image_urls && item.image_urls.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">{t("a_submitted_photos")} ({item.image_urls.length})</p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {item.image_urls.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer">
                                <SafeImage src={url} alt={`${item.name} photo`} className="h-28 w-full rounded-xl object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.description && <p className="whitespace-pre-line text-sm leading-6 text-[#52685a] dark:text-[#a9bcae]">{item.description}</p>}
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        {deptName && <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">Department</dt><dd className="mt-1">{deptName}</dd></div>}
                        {item.address && <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">Address</dt><dd className="mt-1">{item.address}</dd></div>}
                        {item.contact_phone && <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">Phone</dt><dd className="mt-1">{item.contact_phone}</dd></div>}
                        {item.booking_url && <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">Booking link</dt><dd className="mt-1 break-all"><a href={item.booking_url} target="_blank" rel="noreferrer" className="text-[#315c46] dark:text-[#7fb894] underline">{item.booking_url}</a></dd></div>}
                      </dl>
                      {item.facilities && item.facilities.length > 0 && (
                        <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">Facilities</p><div className="mt-2 flex flex-wrap gap-2">{item.facilities.map((f) => <span key={f} className="rounded-full bg-white dark:bg-[#121a15] border border-[#e8eae2] dark:border-[#223028] px-3 py-1.5 text-xs font-medium">{f}</span>)}</div></div>
                      )}
                      {(item.rooms_count != null || item.max_guests != null || item.ac_type) && (
                        <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#8a9b8b] dark:text-[#8fa393]">Property details</p><div className="mt-2 flex flex-wrap gap-2">
                          {item.rooms_count != null && <span className="rounded-full bg-white dark:bg-[#121a15] border border-[#e8eae2] dark:border-[#223028] px-3 py-1.5 text-xs font-medium">🛏 {item.rooms_count} rooms</span>}
                          {item.max_guests != null && <span className="rounded-full bg-white dark:bg-[#121a15] border border-[#e8eae2] dark:border-[#223028] px-3 py-1.5 text-xs font-medium">👥 up to {item.max_guests} guests</span>}
                          {item.ac_type && <span className="rounded-full bg-white dark:bg-[#121a15] border border-[#e8eae2] dark:border-[#223028] px-3 py-1.5 text-xs font-medium">❄ {item.ac_type === "Non-AC" ? "Non-AC" : item.ac_type === "Mixed" ? "Mixed AC" : "Air-conditioned"}</span>}
                        </div></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}</div>}
          </section>

          <section className="mt-8 overflow-hidden rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15]">
            <div className="border-b border-[#ecece5] dark:border-[#223028] px-5 py-5 sm:px-7"><h2 className="text-xl font-semibold">{t("a_suggest_title")}</h2><p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">{t("a_suggest_sub")}</p></div>
            {loading ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">{t("a_loading_suggestions")}</p> : suggestions.length === 0 ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">{t("a_no_suggestions")}</p> : <div className="divide-y divide-[#ecece5] dark:divide-[#223028]">{suggestions.map((suggestion) => <article key={suggestion.id} className="px-5 py-5 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{submissions.find((item) => item.id === suggestion.bungalow_id)?.name ?? "Bungalow listing"}</p><p className="mt-1 text-xs text-[#8a9b8b] dark:text-[#8fa393]">Suggested {new Date(suggestion.created_at).toLocaleDateString()}</p></div><div className="flex gap-2"><button disabled={busyId === suggestion.id} onClick={() => void reviewSuggestion(suggestion, "rejected")} className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2 text-xs font-semibold text-[#52685a] dark:text-[#a9bcae] disabled:opacity-60">{t("a_reject")}</button><button disabled={busyId === suggestion.id} onClick={() => void reviewSuggestion(suggestion, "approved")} className="rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{busyId === suggestion.id ? t("a_saving") : t("a_approve_edits")}</button></div></div><dl className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(suggestion.proposed_changes).map(([key, value]) => <div key={key} className="rounded-xl bg-[#f5f6f1] dark:bg-[#182219] p-3"><dt className="text-xs font-semibold capitalize text-[#8a9b8b] dark:text-[#8fa393]">{key.replaceAll("_", " ")}</dt><dd className="mt-1 break-words text-sm text-[#52685a] dark:text-[#a9bcae]">{value == null || value === "" ? "(clear this field)" : String(value)}</dd></div>)}</dl></article>)}</div>}
          </section>
        </>}
        {message && <p role="status" className="mt-5 rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-4 text-sm text-[#52685a] dark:text-[#a9bcae]">{message}</p>}
      </div>
    </main>
  );
}
