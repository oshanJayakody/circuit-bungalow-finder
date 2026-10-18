"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { safeHttpUrl } from "@/lib/urls";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/lib/i18n";
import SiteLogo from "@/components/SiteLogo";
import PageNav from "@/components/PageNav";
import BookmarkButton from "@/components/BookmarkButton";
import SafeImage from "@/components/SafeImage";

type Bungalow = {
  id: string;
  name: string;
  district: string;
  town: string;
  address: string | null;
  description: string | null;
  image_urls: string[] | null;
  department_id: number | null;
};

const PAGE_SIZE = 24;

export default function DestinationList({ town }: { town: string }) {
  const [bungalows, setBungalows] = useState<Bungalow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [departmentNames, setDepartmentNames] = useState<Map<number, string>>(new Map());
  const requestId = useRef(0);

  const load = useCallback(async (pageToLoad: number, append: boolean) => {
    const currentRequest = ++requestId.current;
    if (append) setLoadingMore(true); else setLoading(true);
    // Town comes from the URL path. Bound its size and strip filter
    // operators before interpolating into PostgREST filter syntax.
    const term = town.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ");
    try {
      const { data, error } = await supabase.from("bungalows")
        .select("id, name, district, town, address, description, image_urls, department_id")
        .eq("status", "approved")
        .or(`town.ilike.%${term}%,district.ilike.%${term}%`)
        .order("name")
        .range(pageToLoad * PAGE_SIZE, (pageToLoad + 1) * PAGE_SIZE - 1);
      if (currentRequest !== requestId.current) return;
      if (error) {
        console.error(error.message);
        if (!append) setBungalows([]);
      } else {
        const rows = data ?? [];
        setBungalows((prev) => append ? [...prev, ...rows] : rows);
        setPage(pageToLoad);
        setHasMore(rows.length === PAGE_SIZE);
      }
    } catch (loadError) {
      console.error(loadError);
      if (currentRequest === requestId.current && !append) setBungalows([]);
    } finally {
      if (currentRequest === requestId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [town]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(0, false), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("bookmarks").select("bungalow_id").eq("user_id", user.id);
      if (data) setSavedIds(new Set(data.map((row) => row.bungalow_id as string)));
    })();
    void supabase.from("departments").select("id, name")
      .then(({ data }) => {
        const map = new Map<number, string>();
        for (const d of (data ?? []) as { id: number; name: string }[]) map.set(d.id, d.name);
        setDepartmentNames(map);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#fffefa] text-[#23372f] dark:bg-[#0b100e] dark:text-[#e9f1ea]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-5 sm:px-9 lg:px-14">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Circuit Bungalow Finder home">
          <SiteLogo />
          <span className="text-[15px] font-bold leading-tight tracking-[-0.04em] sm:text-lg">Circuit Bungalow Finder</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <PageNav />
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-9 lg:px-14">
        <div className="pt-6 sm:pt-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">Destination</p>
          <h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Bungalows in {town}</h1>
          <p className="mt-3 text-sm leading-6 text-[#718077] dark:text-[#9db0a2] sm:text-base">
            {loading ? "Finding lovely places…" : `${bungalows.length}${hasMore ? "+" : ""} government ${bungalows.length === 1 ? "bungalow" : "bungalows"} in and around ${town}.`}
          </p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-[#718077] dark:text-[#9db0a2]">Finding lovely places…</p>
        ) : bungalows.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-[#f3f4ee] px-6 py-14 text-center dark:bg-[#151f19]">
            <p className="text-lg font-semibold">No bungalows found in {town} yet</p>
            <p className="mt-2 text-sm text-[#718077] dark:text-[#9db0a2]">Try another destination.</p>
            <Link href="/" className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold shadow-sm dark:bg-[#121a15]">Back home</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bungalows.map((bungalow, index) => {
                const imageUrl = safeHttpUrl(bungalow.image_urls?.[0]);
                return (
                  <article key={bungalow.id} className="group min-w-0">
                    <div className="relative mb-3 aspect-[1.13/1] overflow-hidden rounded-2xl bg-[#e9ece5] dark:bg-[#1d2b22]">
                      <Link href={`/bungalows/${bungalow.id}`} aria-label={`View ${bungalow.name} details`} className="absolute inset-0 z-0">
                        <SafeImage
                          src={imageUrl}
                          alt={bungalow.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          fallback={
                            <div className={`grid h-full w-full place-items-center ${["bg-[#e7eee5]", "bg-[#eee8dd]", "bg-[#e4edf0]", "bg-[#ebe6ed]"][index % 4]} dark:bg-[#1d2b22]`}>
                              <span className="text-5xl text-[#9aab9c]">⌂</span>
                            </div>
                          }
                        />
                      </Link>
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#34513f] backdrop-blur dark:bg-[#121a15]/90 dark:text-[#8fc39e]">Government stay</span>
                      <span className="absolute right-3 top-3"><BookmarkButton bungalowId={bungalow.id} initialSaved={savedIds.has(bungalow.id)} /></span>
                    </div>
                    <Link href={`/bungalows/${bungalow.id}`} className="block rounded-sm focus-visible:outline-2 focus-visible:outline-[#315c46]">
                      <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a9b8b] dark:text-[#8fa393]">{departmentNames.get(bungalow.department_id ?? -1) ?? "Government stay"}</p>
                      <h3 className="mt-1 truncate text-[15px] font-semibold">{bungalow.name}</h3>
                      <p className="mt-1 truncate text-sm text-[#78867d] dark:text-[#98ab9d]">{bungalow.town}, {bungalow.district}</p>
                      {bungalow.description && <p className="mt-1 line-clamp-1 text-sm text-[#78867d] dark:text-[#98ab9d]">{bungalow.description}</p>}
                      <p className="mt-2 text-sm font-semibold text-[#315c46] dark:text-[#7fb894]">View bungalow details →</p>
                    </Link>
                  </article>
                );
              })}
            </div>
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => void load(page + 1, true)}
                  disabled={loadingMore}
                  className="rounded-full border border-[#dce3dc] bg-white px-8 py-3.5 text-sm font-semibold text-[#244f3d] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f5f6f1] disabled:translate-none disabled:opacity-60 dark:border-[#243830] dark:bg-[#121a15] dark:text-[#7fb894] dark:hover:bg-[#182219]"
                >
                  {loadingMore ? "Loading more…" : "Load more bungalows"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
