"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin";
import ThemeToggle from "@/components/ThemeToggle";
import PageNav from "@/components/PageNav";

type Submission = {
  id: string;
  name: string;
  district: string;
  town: string;
  status: string;
  submitted_by: string | null;
  created_at: string;
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
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

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

    const [listingResult, suggestionResult, analyticsResult] = await Promise.all([
      supabase.from("bungalows").select("id, name, district, town, status, submitted_by, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(100),
      supabase.from("bungalow_suggestions").select("id, bungalow_id, user_id, proposed_changes, status, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(100),
      supabase.rpc("get_admin_analytics"),
    ]);
    if (listingResult.error) {
      setMessage(`Unable to load dashboard data: ${listingResult.error.message}`);
      setLoading(false);
      return;
    }
    if (suggestionResult.error) setMessage(`Unable to load edit suggestions: ${suggestionResult.error.message}`);
    if (analyticsResult.error) setMessage(`Unable to load analytics: ${analyticsResult.error.message}`);
    const rows = (listingResult.data ?? []) as Submission[];
    setSubmissions(rows);
    setSuggestions((suggestionResult.data ?? []) as EditSuggestion[]);
    if (analyticsResult.data?.[0]) setAnalytics(analyticsResult.data[0]);
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
        <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#244f3d] dark:bg-[#3d7a5c] text-xl text-white">⌂</span><span className="text-lg font-bold tracking-[-.04em]">Circuit Bungalow Finder</span></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <PageNav />
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-9 lg:px-14">
        <div className="mb-8 pt-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">Management</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Admin dashboard</h1><p className="mt-3 text-sm text-[#718077] dark:text-[#9db0a2]">Review community submissions and track the directory.</p></div>

        {isAdmin === false && <section className="max-w-xl rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-7 shadow-sm"><h2 className="text-xl font-semibold">Admin access required</h2><p className="mt-2 text-sm leading-6 text-[#718077] dark:text-[#9db0a2]">Sign in with the verified admin email or an account assigned the admin role in Supabase.</p><Link href="/login" className="mt-5 inline-block rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-3 text-sm font-semibold text-white">Log in</Link></section>}

        {isAdmin && <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[{ label: "Awaiting review", value: analytics.pending, icon: "◷" }, { label: "Published bungalows", value: analytics.approved, icon: "⌂" }, { label: "Contributors", value: analytics.contributors, icon: "♧" }].map((item) => <article key={item.label} className="rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-6"><div className="flex items-center justify-between"><span className="text-sm font-medium text-[#718077] dark:text-[#9db0a2]">{item.label}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8eee5] dark:bg-[#1d2b22] text-lg text-[#315c46] dark:text-[#7fb894]">{item.icon}</span></div><p className="mt-5 text-4xl font-semibold tracking-[-.05em]">{loading ? "—" : item.value}</p></article>)}
          </div>

          <section className="mt-10 overflow-hidden rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ecece5] dark:border-[#223028] px-5 py-5 sm:px-7"><div><h2 className="text-xl font-semibold">Contribution queue</h2><p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">Approve a listing to make it visible in search and on the map.</p></div><span className="rounded-full bg-[#f3f4ee] dark:bg-[#151f19] px-3 py-1.5 text-xs font-semibold text-[#52685a] dark:text-[#a9bcae]">{analytics.pending} pending · latest 100 shown</span></div>
            {loading ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">Loading submissions…</p> : submissions.length === 0 ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">No submissions yet.</p> : <div className="divide-y divide-[#ecece5] dark:divide-[#223028]">{submissions.map((item) => <div key={item.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.name}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${item.status === "approved" ? "bg-[#e8eee5] dark:bg-[#1d2b22] text-[#315c46] dark:text-[#7fb894]" : "bg-[#f5eddd] dark:bg-[#2b2417] text-[#8a6732] dark:text-[#d9b36c]"}`}>{item.status}</span></div><p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">{item.town}, {item.district} · Submitted {new Date(item.created_at).toLocaleDateString()}</p><p className="mt-1 truncate text-xs text-[#9aa69e] dark:text-[#6f8175]">Contribution ID: {item.id}</p></div>{item.status === "pending" && <button onClick={() => void approve(item.id)} disabled={busyId === item.id} className="shrink-0 rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#183d2e] dark:hover:bg-[#2c5a44] disabled:opacity-60">{busyId === item.id ? "Approving…" : "Approve listing"}</button>}</div>)}</div>}
          </section>

          <section className="mt-8 overflow-hidden rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15]">
            <div className="border-b border-[#ecece5] dark:border-[#223028] px-5 py-5 sm:px-7"><h2 className="text-xl font-semibold">Edit suggestions</h2><p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">Approved changes are copied onto the live bungalow listing.</p></div>
            {loading ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">Loading suggestions…</p> : suggestions.length === 0 ? <p className="p-7 text-sm text-[#718077] dark:text-[#9db0a2]">No edit suggestions awaiting review.</p> : <div className="divide-y divide-[#ecece5] dark:divide-[#223028]">{suggestions.map((suggestion) => <article key={suggestion.id} className="px-5 py-5 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{submissions.find((item) => item.id === suggestion.bungalow_id)?.name ?? "Bungalow listing"}</p><p className="mt-1 text-xs text-[#8a9b8b] dark:text-[#8fa393]">Suggested {new Date(suggestion.created_at).toLocaleDateString()}</p></div><div className="flex gap-2"><button disabled={busyId === suggestion.id} onClick={() => void reviewSuggestion(suggestion, "rejected")} className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2 text-xs font-semibold text-[#52685a] dark:text-[#a9bcae] disabled:opacity-60">Reject</button><button disabled={busyId === suggestion.id} onClick={() => void reviewSuggestion(suggestion, "approved")} className="rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{busyId === suggestion.id ? "Saving…" : "Approve edits"}</button></div></div><dl className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(suggestion.proposed_changes).map(([key, value]) => <div key={key} className="rounded-xl bg-[#f5f6f1] dark:bg-[#182219] p-3"><dt className="text-xs font-semibold capitalize text-[#8a9b8b] dark:text-[#8fa393]">{key.replaceAll("_", " ")}</dt><dd className="mt-1 break-words text-sm text-[#52685a] dark:text-[#a9bcae]">{value == null || value === "" ? "(clear this field)" : String(value)}</dd></div>)}</dl></article>)}</div>}
          </section>
        </>}
        {message && <p role="status" className="mt-5 rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-4 text-sm text-[#52685a] dark:text-[#a9bcae]">{message}</p>}
      </div>
    </main>
  );
}
