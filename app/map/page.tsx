"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/lib/i18n";
import SiteLogo from "@/components/SiteLogo";
import PageNav from "@/components/PageNav";

const BungalowMap = dynamic(
  () => import("@/components/BungalowMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-xl border">
        Loading map...
      </div>
    ),
  }
);

type Location = {
  id: string;
  name: string;
  district: string;
  town: string;
  latitude: number;
  longitude: number;
  department_id: number | null;
};

type Department = { id: number; name: string };

export default function MapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [whereDraft, setWhereDraft] = useState("");
  const [departmentDraft, setDepartmentDraft] = useState("");
  const [where, setWhere] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadBungalows() {
      try {
      const { data, error } = await supabase
        .from("bungalows")
        .select(
          "id, name, district, town, latitude, longitude, department_id"
        )
        .eq("status", "approved")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(1000);

      if (cancelled) return;
      if (error) {
        console.error(error);
        setError("Unable to load bungalow locations.");
      } else {
        setLocations((data || []).filter((location) =>
          Number.isFinite(location.latitude) && location.latitude >= -90 && location.latitude <= 90
          && Number.isFinite(location.longitude) && location.longitude >= -180 && location.longitude <= 180
        ));
      }

      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Unable to load bungalow locations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBungalows();
    void supabase.from("departments").select("id, name").order("name")
      .then(
        ({ data, error: departmentError }) => {
          if (departmentError) console.error("Unable to load departments:", departmentError.message);
          else if (!cancelled) setDepartments(data ?? []);
        },
        (loadError: unknown) => console.error("Unable to load departments:", loadError),
      );
    return () => { cancelled = true; };
  }, []);

  const filteredLocations = useMemo(() => locations.filter((location) => {
    const term = where.trim().toLocaleLowerCase();
    const matchesText = !term || [location.name, location.town, location.district]
      .some((value) => value.toLocaleLowerCase().includes(term));
    const matchesDepartment = !department || String(location.department_id) === department;
    return matchesText && matchesDepartment;
  }), [locations, where, department]);

  function searchMap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWhere(whereDraft);
    setDepartment(departmentDraft);
  }

  function clearSearch() {
    setWhereDraft("");
    setDepartmentDraft("");
    setWhere("");
    setDepartment("");
  }

  return (
    <main className="min-h-screen bg-[#fffefa] dark:bg-[#0b100e] text-[#23372f] dark:text-[#e9f1ea]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-9 lg:px-14">
        <Link href="/" className="flex items-center gap-3">
          <SiteLogo />
          <span className="text-[15px] font-bold leading-tight tracking-[-.04em] sm:text-lg">Circuit Bungalow Finder</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <PageNav />
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-12 sm:px-9 lg:px-14">
        <div className="mb-7 pt-6 sm:pt-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#8a9b8b] dark:text-[#8fa393]">Find your way around</p>
          <h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Bungalows across Sri Lanka</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718077] dark:text-[#9db0a2] sm:text-base">Explore approved government stays by location and department.</p>
        </div>

        <form onSubmit={searchMap} className="mb-5 grid gap-2 rounded-[24px] border border-[#ecece5] dark:border-[#223028] bg-white dark:bg-[#121a15] p-3 shadow-[0_14px_44px_rgba(35,55,47,.09)] sm:grid-cols-[1.2fr_1fr_auto_auto] sm:items-center sm:rounded-full sm:p-2 sm:pl-7">
          <label className="min-w-0 px-3 py-2 sm:border-r sm:border-[#e9eae4] dark:sm:border-[#223028] sm:py-1">
            <span className="block text-xs font-bold">Where</span>
            <input value={whereDraft} onChange={(event) => setWhereDraft(event.target.value)} placeholder="District, town or bungalow" className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-[#53665d] dark:text-[#b9c9bd] outline-none placeholder:text-[#9aa69e] dark:placeholder:text-[#6f8175] focus:ring-0" />
          </label>
          <label className="min-w-0 px-3 py-2 sm:py-1">
            <span className="block text-xs font-bold">Department</span>
            <select value={departmentDraft} onChange={(event) => setDepartmentDraft(event.target.value)} className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-[#53665d] dark:text-[#b9c9bd] outline-none focus:ring-0">
              <option value="">All departments</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#183d2e] dark:hover:bg-[#2c5a44]">⌕ Search map</button>
          <button type="button" onClick={clearSearch} className="rounded-full px-4 py-3 text-sm font-semibold text-[#52685a] dark:text-[#a9bcae] hover:bg-[#f3f4ee] dark:hover:bg-[#151f19]">Clear</button>
        </form>

        {!loading && !error && <div className="mb-3 flex items-center justify-between text-sm text-[#718077] dark:text-[#9db0a2]"><span>{filteredLocations.length} {filteredLocations.length === 1 ? "bungalow" : "bungalows"} on the map</span>{(where || department) && <button onClick={clearSearch} className="font-semibold text-[#315c46] dark:text-[#7fb894] hover:underline">Clear filters</button>}</div>}

        {loading && (
          <p className="mb-4 rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-4 text-sm text-[#718077] dark:text-[#9db0a2]">
          Loading bungalow locations...
        </p>
      )}

        {error && (
          <p className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

        {!loading && !error && (
        <BungalowMap locations={filteredLocations} />
      )}

        {!loading && !error && locations.length === 0 && (
        <p className="mt-4 rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-5 text-sm text-[#718077] dark:text-[#9db0a2]">
          No approved bungalow locations with coordinates are available yet.
        </p>
      )}
        {!loading && !error && locations.length > 0 && filteredLocations.length === 0 && <p className="mt-4 rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-5 text-sm text-[#718077] dark:text-[#9db0a2]">No bungalows match those filters. Try another search.</p>}
      </div>
    </main>
  );
}
