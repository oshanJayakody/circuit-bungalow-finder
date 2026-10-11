"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin";
import { safeHttpUrl } from "@/lib/urls";
import BungalowSubmissionForm from "@/components/BungalowSubmissionForm";
import ThemeToggle from "@/components/ThemeToggle";

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
type Department = { id: number; name: string };

const destinations = [
  { name: "Nuwara Eliya", detail: "Cool highland air", image: "/destinations/nuwara-eliya.jpg" },
  { name: "Kandy", detail: "Culture & hills", image: "/destinations/kandy.jpg" },
  { name: "Galle", detail: "Coastal heritage", image: "/destinations/galle.jpg" },
  { name: "Badulla", detail: "Tea country views", image: "/destinations/badulla.jpg" },
  { name: "Kataragama", detail: "Sacred city & wildlife", image: "/destinations/kataragama.jpg" },
  { name: "Anuradhapura", detail: "Ancient stupas", image: "/destinations/anuradhapura.jpg" },
];

const PAGE_SIZE = 24;

export default function Home() {
  const router = useRouter();
  const [bungalows, setBungalows] = useState<Bungalow[]>([]);
  const [where, setWhere] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    let oauthReturn = window.sessionStorage.getItem("admin-oauth-pending") === "true";
    let handledOAuthReturn = false;
    let sessionCheck = 0;
    function updateSession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      const checkId = ++sessionCheck;
      setSignedIn(Boolean(session));
      if (!session) {
        setIsAdmin(false);
        return;
      }
      void isAdminUser(session.user).then((admin) => {
        if (checkId !== sessionCheck) return;
        setIsAdmin(admin);
        if (oauthReturn && !handledOAuthReturn) {
          handledOAuthReturn = true;
          oauthReturn = false;
          window.sessionStorage.removeItem("admin-oauth-pending");
          router.replace(admin ? "/admin" : "/");
        }
      }).catch((error) => console.error("Unable to check admin access:", error));
    }

    void supabase.auth.getSession().then(({ data }) => {
      updateSession(data.session);
      if (!data.session && oauthReturn) {
        oauthReturn = false;
        window.sessionStorage.removeItem("admin-oauth-pending");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => updateSession(session), 0);
    });
    void supabase.from("departments").select("id, name").order("name")
      .then(({ data }) => setDepartments(data ?? []));
    return () => subscription.unsubscribe();
  }, [router]);

  const loadBungalows = useCallback(async (pageToLoad: number, append: boolean) => {
    const currentRequest = ++requestId.current;
    if (append) setLoadingMore(true); else setLoading(true);
    let query = supabase.from("bungalows")
      .select("id, name, district, town, address, description, image_urls, department_id")
      .eq("status", "approved").order("name");
    if (where.trim()) {
      // This value is interpolated into PostgREST filter syntax. Strip filter
      // operators and bound its size before building the `.or(...)` expression.
      const term = where.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ");
      if (term) query = query.or(`name.ilike.%${term}%,town.ilike.%${term}%,district.ilike.%${term}%`);
    }
    if (department) query = query.eq("department_id", Number(department));
    try {
    const { data, error } = await query.range(pageToLoad * PAGE_SIZE, (pageToLoad + 1) * PAGE_SIZE - 1);
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
  }, [department, where]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBungalows(0, false), 250);
    return () => window.clearTimeout(timer);
  }, [loadBungalows]);

  function handleLoadMore() {
    void loadBungalows(page + 1, true);
  }

  function chooseDestination(name: string) {
    setWhere(name);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffefa] dark:bg-[#0b100e] text-[#23372f] dark:text-[#e9f1ea]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-5 sm:px-9 lg:px-14">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Circuit Bungalow Finder home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#244f3d] dark:bg-[#3d7a5c] text-xl text-white">⌂</span>
          <span className="text-[15px] font-bold leading-tight tracking-[-0.04em] sm:text-lg">Circuit Bungalow<br className="sm:hidden" /> Finder</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#51655b] dark:text-[#a9bcae] lg:flex">
          <a href="#explore" className="text-[#244f3d] dark:text-[#3d7a5c]">Explore</a>
          <a href="#bungalows" className="transition hover:text-[#244f3d] dark:hover:text-[#3d7a5c]">Government bungalows</a>
          <a href="#destinations" className="transition hover:text-[#244f3d] dark:hover:text-[#3d7a5c]">Places</a>
          <a href="#contribute" className="transition hover:text-[#244f3d] dark:hover:text-[#3d7a5c]">Become a contributor</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[#51655b] dark:text-[#a9bcae] hover:bg-[#f2f3ed] dark:hover:bg-[#1a2620] sm:block" aria-label="Language and currency">EN · LKR</button>
          <a href="#help" className="hidden rounded-full p-2 text-sm text-[#51655b] dark:text-[#a9bcae] hover:bg-[#f2f3ed] dark:hover:bg-[#1a2620] md:block">Help</a>
          {signedIn ? (
            <>
              <Link href="/profile" className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">Profile</Link>
              {isAdmin && <Link href="/admin" className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">Admin</Link>}
              <button onClick={() => void supabase.auth.signOut()} className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">Log out</button>
            </>
          ) : (
            <Link href="/login" className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">Log in <span className="hidden sm:inline">/ Sign up</span></Link>
          )}
        </div>
      </header>

      <section id="explore" className="mx-auto max-w-[1440px] px-5 pb-10 pt-4 sm:px-9 lg:px-14 lg:pb-16 lg:pt-8">
        <div className="relative isolate min-h-[490px] overflow-hidden rounded-[30px] bg-[#425b48] dark:bg-[#0f1a14] sm:min-h-[550px] sm:rounded-[38px]">
          <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(16,38,29,.68) 0%, rgba(23,47,36,.36) 52%, rgba(23,47,36,.05) 100%), url('/hero-bungalow.jpg')" }} />
          <div className="flex min-h-[490px] flex-col justify-center px-7 py-12 text-white sm:min-h-[550px] sm:px-12 lg:px-16">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-white/85"><span className="h-px w-8 bg-[#d1bd8e]" /> Stay somewhere with a story</p>
            <h1 className="max-w-2xl text-[42px] font-semibold leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-[72px]">Find your quiet<br className="hidden sm:block" /> corner of Sri Lanka.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/85 sm:text-lg">Discover welcoming government bungalows, tucked into the island’s most beautiful places.</p>
            <a href="#search" className="mt-8 flex w-fit items-center gap-2 rounded-full bg-white dark:bg-[#121a15] px-5 py-3 text-sm font-semibold text-[#244f3d] dark:text-[#3d7a5c] shadow-lg transition hover:-translate-y-0.5">Find a bungalow <span aria-hidden="true">↓</span></a>
          </div>
          <div className="absolute bottom-5 right-6 hidden items-center gap-2 rounded-full bg-black/25 px-3 py-2 text-xs text-white/90 backdrop-blur-sm sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#d6c79e]" /> A slower way to see the island</div>
        </div>

        <form id="search" className="relative z-10 mx-auto -mt-7 grid max-w-5xl gap-2 rounded-[24px] border border-[#ecece5] dark:border-[#223028] bg-white dark:bg-[#121a15] p-3 shadow-[0_18px_60px_rgba(35,55,47,.13)] sm:grid-cols-[1.2fr_1fr_auto] sm:items-center sm:rounded-full sm:p-2 sm:pl-7" onSubmit={(event) => { event.preventDefault(); document.getElementById("bungalows")?.scrollIntoView({ behavior: "smooth" }); }}>
          <label className="min-w-0 px-3 py-2 sm:border-r sm:border-[#e9eae4] dark:sm:border-[#223028] sm:py-1">
            <span className="block text-xs font-bold text-[#23372f] dark:text-[#e9f1ea]">Where</span>
            <input value={where} onChange={(event) => setWhere(event.target.value)} placeholder="District, town or bungalow" className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-[#53665d] dark:text-[#b9c9bd] outline-none placeholder:text-[#9aa69e] dark:placeholder:text-[#6f8175] focus:ring-0" />
          </label>
          <label className="min-w-0 px-3 py-2 sm:py-1">
            <span className="block text-xs font-bold text-[#23372f] dark:text-[#e9f1ea]">Department</span>
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-[#53665d] dark:text-[#b9c9bd] outline-none focus:ring-0">
              <option value="">All departments</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button className="flex items-center justify-center gap-2 rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#183d2e] dark:hover:bg-[#2c5a44]" type="submit"><span aria-hidden="true">⌕</span> Search</button>
        </form>
      </section>

      <section id="destinations" className="mx-auto max-w-[1440px] px-5 py-9 sm:px-9 lg:px-14 lg:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">A little inspiration</p><h2 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Explore by destination</h2></div>
          <a href="#bungalows" className="hidden text-sm font-semibold text-[#315c46] dark:text-[#7fb894] hover:underline sm:block">Browse all stays ↗</a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {destinations.map((place) => (
            <button
              key={place.name}
              onClick={() => chooseDestination(place.name)}
              className="group relative min-h-44 overflow-hidden rounded-2xl text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-h-56"
            >
              <img src={place.image} alt={place.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="block text-base font-bold text-white sm:text-xl">{place.name}</span>
                <span className="mt-1 block text-xs text-white/80 sm:text-sm">{place.detail}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="bungalows" className="mx-auto max-w-[1440px] px-5 py-10 sm:px-9 lg:px-14 lg:py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">Thoughtfully selected</p><h2 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Government bungalows</h2><p className="mt-2 text-sm text-[#718077] dark:text-[#9db0a2]">A good place to begin your next journey.</p></div>
          <Link href="/map" className="rounded-full border border-[#dce3dc] dark:border-[#243830] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">Explore the map ↗</Link>
        </div>
        {loading ? <p className="py-12 text-center text-sm text-[#718077] dark:text-[#9db0a2]">Finding lovely places…</p> : bungalows.length === 0 ? (
          <div className="rounded-3xl bg-[#f3f4ee] dark:bg-[#151f19] px-6 py-14 text-center"><p className="text-lg font-semibold">No approved bungalows found yet</p><p className="mt-2 text-sm text-[#718077] dark:text-[#9db0a2]">Try another destination or clear your search.</p><button onClick={() => { setWhere(""); setDepartment(""); }} className="mt-5 rounded-full bg-white dark:bg-[#121a15] px-5 py-2.5 text-sm font-semibold shadow-sm">Clear search</button></div>
        ) : <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bungalows.map((bungalow, index) => {
            const imageUrl = safeHttpUrl(bungalow.image_urls?.[0]);
            return <article key={bungalow.id} className="group min-w-0">
              <div className="relative mb-3 aspect-[1.13/1] overflow-hidden rounded-2xl bg-[#e9ece5] dark:bg-[#1d2b22]">
                <Link href={`/bungalows/${bungalow.id}`} aria-label={`View ${bungalow.name} details`} className="absolute inset-0 z-0">{imageUrl ? <img src={imageUrl} alt={bungalow.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className={`grid h-full w-full place-items-center ${["bg-[#e7eee5] dark:bg-[#1d2b22]", "bg-[#eee8dd] dark:bg-[#262019]", "bg-[#e4edf0] dark:bg-[#19242a]", "bg-[#ebe6ed] dark:bg-[#241f2b]"][index % 4]}`}><span className="text-5xl text-[#9aab9c]">⌂</span></div>}</Link>
                <span className="absolute left-3 top-3 rounded-full bg-white/90 dark:bg-[#121a15]/90 px-3 py-1.5 text-[11px] font-bold text-[#34513f] dark:text-[#8fc39e] backdrop-blur">Government stay</span>
                <button type="button" aria-label="Save bungalow" onClick={(event) => event.preventDefault()} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 dark:bg-[#121a15]/90 text-lg text-[#405a4b] dark:text-[#93b3a0] backdrop-blur transition hover:scale-105">♡</button>
              </div>
              <Link href={`/bungalows/${bungalow.id}`} className="block rounded-sm focus-visible:outline-2 focus-visible:outline-[#315c46] dark:focus-visible:outline-[#7fb894]"><div className="flex items-start justify-between gap-3"><h3 className="truncate text-[15px] font-semibold">{bungalow.town}, {bungalow.district}</h3><span className="shrink-0 text-sm text-[#52685a] dark:text-[#a9bcae]">⌂</span></div>
              <p className="mt-1 truncate text-sm text-[#78867d] dark:text-[#98ab9d]">{bungalow.name}</p>
              {bungalow.description && <p className="mt-1 line-clamp-1 text-sm text-[#78867d] dark:text-[#98ab9d]">{bungalow.description}</p>}
              <p className="mt-2 text-sm font-semibold text-[#315c46] dark:text-[#7fb894]">View bungalow details →</p></Link>
          </article>;
          })}
        </div>}
        {!loading && bungalows.length > 0 && (
          <div className="mt-10 text-center">
            <p className="mb-4 text-sm text-[#718077] dark:text-[#9db0a2]">
              Showing {bungalows.length} {bungalows.length === 1 ? "bungalow" : "bungalows"}{hasMore ? "" : " — you've seen them all"}
            </p>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full border border-[#dce3dc] bg-white px-8 py-3.5 text-sm font-semibold text-[#244f3d] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f5f6f1] disabled:translate-none disabled:opacity-60 dark:border-[#243830] dark:bg-[#121a15] dark:text-[#7fb894] dark:hover:bg-[#182219]"
              >
                {loadingMore ? "Loading more…" : "Load more bungalows"}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-14 lg:py-12">
        <div className="flex flex-col overflow-hidden rounded-[28px] bg-[#e8eee5] dark:bg-[#1d2b22] md:flex-row md:items-stretch">
          <div className="flex flex-1 flex-col justify-center p-7 sm:p-10 lg:p-14"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#758c78] dark:text-[#93a794]">Find your way</p><h2 className="mt-3 max-w-lg text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">A beautiful stay is closer than you think.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#64766a] dark:text-[#a3b6a8]">See approved bungalows across Sri Lanka and find a peaceful base for your travels.</p><Link href="/map" className="mt-6 w-fit rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#183d2e] dark:hover:bg-[#2c5a44]">Open bungalow map ↗</Link></div>
          <div className="relative min-h-56 flex-1 bg-[#dbe5d9] dark:bg-[#1a2620] md:min-h-80"><div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80')" }} /><div className="absolute inset-0 bg-[#264834]/15" /><div className="absolute left-[48%] top-[35%] grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#315c46] dark:bg-[#7fb894] text-xl text-white shadow-xl">⌂</div><div className="absolute left-[26%] top-[57%] grid h-9 w-9 place-items-center rounded-full border-4 border-white bg-[#d3a767] text-sm text-white shadow-lg">⌂</div><div className="absolute left-[71%] top-[23%] grid h-9 w-9 place-items-center rounded-full border-4 border-white bg-[#d3a767] text-sm text-white shadow-lg">⌂</div></div>
        </div>
      </section>

      <section id="contribute" className="mx-auto max-w-[1440px] px-5 py-10 sm:px-9 lg:px-14 lg:py-16">
        {signedIn ? <BungalowSubmissionForm departments={departments} /> : <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-7 sm:flex-row sm:items-center sm:p-10"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">Know a special place?</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Help someone discover it.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#718077] dark:text-[#9db0a2]">Share a government bungalow with the community. Listings are reviewed before they go live.</p></div><Link href="/login" className="shrink-0 rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#183d2e] dark:hover:bg-[#2c5a44]">Become a contributor ↗</Link></div>}
      </section>

      <footer id="help" className="mt-8 bg-[#203b30] dark:bg-[#070b09] text-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-9 md:flex-row md:items-center md:justify-between lg:px-14"><div><Link href="/" className="text-lg font-bold tracking-[-.04em]">Circuit Bungalow Finder</Link><p className="mt-2 text-sm text-white/65">Find your quiet corner of Sri Lanka.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75"><a href="#explore" className="hover:text-white">Explore</a><Link href="/map" className="hover:text-white">Map</Link><a href="#contribute" className="hover:text-white">Contribute</a><Link href="/login" className="hover:text-white">Account</Link></div><p className="text-xs text-white/50">© 2026 Circuit Bungalow Finder</p></div></footer>
    </main>
  );
}
