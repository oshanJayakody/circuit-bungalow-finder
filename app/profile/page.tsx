"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Contribution = { id: string; name: string; district: string; town: string; status: string; created_at: string };
type Rank = { userId: string; count: number };

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [rankings, setRankings] = useState<Rank[]>([]);
  const [contributionStats, setContributionStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setMessage("Log in to see your profile and contributions.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setName(user.user_metadata?.full_name || user.user_metadata?.name || "Contributor");

      const [mineResult, approvedResult, pendingResult, rankingsResult] = await Promise.all([
        supabase.from("bungalows").select("id, name, district, town, status, created_at")
          .eq("submitted_by", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("bungalows").select("id", { count: "exact", head: true })
          .eq("submitted_by", user.id).eq("status", "approved"),
        supabase.from("bungalows").select("id", { count: "exact", head: true })
          .eq("submitted_by", user.id).eq("status", "pending"),
        supabase.rpc("get_contributor_rankings"),
      ]);
      if (mineResult.error) setMessage(`Unable to load your contributions: ${mineResult.error.message}`);
      else {
        setContributions((mineResult.data ?? []) as Contribution[]);
        setContributionStats({
          total: mineResult.count ?? 0,
          approved: approvedResult.count ?? 0,
          pending: pendingResult.count ?? 0,
        });
      }
      if (rankingsResult.error) console.error("Unable to load contributor rankings:", rankingsResult.error.message);
      else setRankings(((rankingsResult.data ?? []) as { user_id: string; listing_count: number | string }[])
        .map((row) => ({ userId: row.user_id, count: Number(row.listing_count) })));
      setLoading(false);
    }
    void loadProfile();
  }, []);

  const approvedCount = contributionStats.approved;
  const rank = rankings.findIndex((item) => item.userId === userId);

  return (
    <main className="min-h-screen bg-[#fffefa] text-[#23372f]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 sm:px-9"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#244f3d] text-xl text-white">⌂</span><span className="font-bold tracking-[-.04em]">Circuit Bungalow Finder</span></Link><Link href="/" className="rounded-full border border-[#dce3dc] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1]">← Explore</Link></header>
      <div className="mx-auto max-w-[1200px] px-5 pb-14 pt-8 sm:px-9 sm:pt-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b]">Your account</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Welcome, {name || "Contributor"}</h1><p className="mt-3 text-sm text-[#718077]">Keep track of the places you’ve shared with the community.</p>
        {message && !userId && <section className="mt-8 max-w-xl rounded-3xl border border-[#e8eae2] bg-white p-7"><p className="text-sm text-[#718077]">{message}</p><Link href="/login" className="mt-5 inline-block rounded-full bg-[#244f3d] px-5 py-3 text-sm font-semibold text-white">Log in</Link></section>}
        {userId && <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[{ label: "Total contributions", value: contributionStats.total }, { label: "Published", value: approvedCount }, { label: "Awaiting review", value: contributionStats.pending }].map((item) => <article key={item.label} className="rounded-3xl border border-[#e8eae2] bg-white p-6"><p className="text-sm text-[#718077]">{item.label}</p><p className="mt-4 text-4xl font-semibold tracking-[-.05em]">{loading ? "—" : item.value}</p></article>)}
          </div>
          <div className="mt-8 grid gap-7 lg:grid-cols-[1.5fr_1fr]">
            <section className="overflow-hidden rounded-3xl border border-[#e8eae2] bg-white"><div className="border-b border-[#ecece5] px-6 py-5"><h2 className="text-xl font-semibold">Your contributions</h2><p className="mt-1 text-sm text-[#718077]">Latest 100 submissions. Counts above include all your listings.</p></div>{loading ? <p className="p-6 text-sm text-[#718077]">Loading your contributions…</p> : contributions.length === 0 ? <div className="p-6"><p className="text-sm text-[#718077]">You haven’t submitted a bungalow yet.</p><Link href="/#contribute" className="mt-4 inline-block text-sm font-semibold text-[#315c46] hover:underline">Share a bungalow →</Link></div> : <div className="divide-y divide-[#ecece5]">{contributions.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 px-6 py-5"><div className="min-w-0"><h3 className="truncate font-semibold">{item.name}</h3><p className="mt-1 text-sm text-[#718077]">{item.town}, {item.district}</p><p className="mt-1 text-xs text-[#9aa69e]">Submitted {new Date(item.created_at).toLocaleDateString()}</p></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${item.status === "approved" ? "bg-[#e8eee5] text-[#315c46]" : "bg-[#f5eddd] text-[#8a6732]"}`}>{item.status}</span></article>)}</div>}</section>
            <section className="overflow-hidden rounded-3xl border border-[#e8eae2] bg-white"><div className="border-b border-[#ecece5] px-6 py-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a9b8b]">Community</p><h2 className="mt-1 text-xl font-semibold">Contributor rankings</h2><p className="mt-1 text-sm text-[#718077]">Ranked by approved bungalow listings.</p></div>{rankings.length === 0 ? <p className="p-6 text-sm text-[#718077]">Rankings will appear as listings are approved.</p> : <ol className="divide-y divide-[#ecece5]">{rankings.map((item, index) => <li key={item.userId} className="flex items-center gap-3 px-6 py-4"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index < 3 ? "bg-[#e8eee5] text-[#315c46]" : "bg-[#f3f4ee] text-[#718077]"}`}>{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.userId === userId ? "You" : `Contributor ${String(index + 1).padStart(2, "0")}`}</span><span className="text-sm text-[#718077]">{item.count} {item.count === 1 ? "listing" : "listings"}</span></li>)}</ol>}{rankings.length > 0 && rank === -1 && approvedCount > 0 && <p className="border-t border-[#ecece5] px-6 py-4 text-xs text-[#718077]">You’re outside the top 10. Your approved listings: {approvedCount}.</p>}</section>
          </div>
        </>}
        {message && userId && <p role="status" className="mt-5 rounded-2xl bg-[#f3f4ee] p-4 text-sm text-[#52685a]">{message}</p>}
      </div>
    </main>
  );
}
