
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

export default function Home() {
  const [bungalows, setBungalows] = useState<Bungalow[]>([]);
  const [district, setDistrict] = useState("");
  const [town, setTown] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("departments")
      .select("id, name")
      .order("name")
      .then(({ data }) => setDepartments(data ?? []));
  }, []);

  const loadBungalows = useCallback(async () => {
    let query = supabase
      .from("bungalows")
      .select(
        "id, name, district, town, address, description, image_urls, department_id"
      )
      .eq("status", "approved")
      .order("name");

    if (district) query = query.eq("district", district);
    if (town) query = query.ilike("town", `%${town}%`);
    if (search) query = query.ilike("name", `%${search}%`);

    if (department) {
      query = query.eq("department_id", Number(department));
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error(error.message);
      setBungalows([]);
    } else {
      setBungalows(data ?? []);
    }

    setLoading(false);
  }, [department, district, search, town]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBungalows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBungalows]);

  async function searchBungalows() {
    setLoading(true);
    await loadBungalows();
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Circuit Bungalow Finder
        </h1>
        <Link href="/login" className="shrink-0 rounded-lg bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">
          Log in
        </Link>
      </header>

      <p className="my-3 text-gray-600">
        Find government circuit bungalows across Sri Lanka.
      </p>

      <div className="my-6 grid gap-3 md:grid-cols-2">
        <input
          className="rounded border p-3"
          placeholder="Bungalow name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="District"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="Town"
          value={town}
          onChange={(e) => setTown(e.target.value)}
        />

        <select
          className="rounded border p-3"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="rounded bg-green-800 px-6 py-3 text-white"
        onClick={searchBungalows}
      >
        Search
      </button>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {loading && <p>Searching...</p>}

        {!loading && bungalows.length === 0 && (
          <p>No approved bungalows found.</p>
        )}

        {bungalows.map((b) => (
          <article
            key={b.id}
            className="overflow-hidden rounded-xl border"
          >
            {b.image_urls?.[0] && (
              <img
                src={b.image_urls[0]}
                alt={b.name}
                className="h-48 w-full object-cover"
              />
            )}

            <div className="p-4">
              <h2 className="text-xl font-semibold">{b.name}</h2>
              <p className="mt-2 text-gray-600">
                {b.town}, {b.district}
              </p>
              {b.address && <p>{b.address}</p>}
              {b.description && <p>{b.description}</p>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
