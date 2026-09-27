"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
};

export default function MapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBungalows() {
      const { data, error } = await supabase
        .from("bungalows")
        .select(
          "id, name, district, town, latitude, longitude"
        )
        .eq("status", "approved")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) {
        console.error(error);
        setError("Unable to load bungalow locations.");
      } else {
        setLocations(data || []);
      }

      setLoading(false);
    }

    loadBungalows();
  }, []);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Circuit Bungalows
      </h1>

      {loading && (
        <p className="mb-4">
          Loading bungalow locations...
        </p>
      )}

      {error && (
        <p className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && (
        <BungalowMap locations={locations} />
      )}

      {!loading && !error && locations.length === 0 && (
        <p className="mt-4 text-gray-600">
          No approved bungalow locations with coordinates
          are available yet.
        </p>
      )}
    </main>
  );
}
