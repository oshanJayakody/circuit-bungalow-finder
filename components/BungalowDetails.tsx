"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";
import BungalowSuggestionForm from "@/components/BungalowSuggestionForm";
import { getBungalowReviews } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";
import { safeHttpUrl, safeTelephone } from "@/lib/urls";
import ThemeToggle from "@/components/ThemeToggle";
import PageNav from "@/components/PageNav";
import BookmarkButton from "@/components/BookmarkButton";

type Bungalow = {
  id: string;
  name: string;
  district: string;
  town: string;
  address: string | null;
  description: string | null;
  image_urls: string[] | null;
  department_id: number | null;
  contact_phone: string | null;
  booking_url: string | null;
  facebook_url: string | null;
  facilities: string[] | null;
  rooms_count: number | null;
  max_guests: number | null;
  ac_type: string | null;
  price_info: string | null;
  latitude: number | null;
  longitude: number | null;
};
type Review = { rating: number; comment: string | null; created_at: string };

export default function BungalowDetails({ bungalowId }: { bungalowId: string }) {
  const [bungalow, setBungalow] = useState<Bungalow | null>(null);
  const [department, setDepartment] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const data = await getBungalowReviews(bungalowId);
      setReviews((data ?? []) as Review[]);
    } catch (reviewError) {
      console.error(reviewError);
    }
  }, [bungalowId]);

  useEffect(() => {
    async function load() {
      try {
      const { data, error: fetchError } = await supabase.from("bungalows")
        .select("id, name, district, town, address, description, image_urls, department_id, contact_phone, booking_url, facebook_url, facilities, rooms_count, max_guests, ac_type, price_info, latitude, longitude")
        .eq("id", bungalowId).eq("status", "approved").maybeSingle();
      if (fetchError) setError(fetchError.message);
      else if (!data) setError("This bungalow could not be found.");
      else {
        setBungalow(data as Bungalow);
        if (data.department_id) {
          const { data: departmentRow } = await supabase.from("departments").select("name").eq("id", data.department_id).maybeSingle();
          setDepartment(departmentRow?.name ?? "");
        }
      }
      await loadReviews();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: bookmark } = await supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("bungalow_id", bungalowId).maybeSingle();
        setSaved(Boolean(bookmark));
      }
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load this bungalow. Please try again.");
      } finally {
      setLoading(false);
      }
    }
    void load();
  }, [bungalowId, loadReviews]);

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  const images = bungalow?.image_urls?.filter((image): image is string => Boolean(safeHttpUrl(image))).slice(0, 5) ?? [];
  const bookingUrl = safeHttpUrl(bungalow?.booking_url);
  const facebookUrl = safeHttpUrl(bungalow?.facebook_url);
  const phoneNumber = safeTelephone(bungalow?.contact_phone);

  return (
    <main className="min-h-screen bg-[#fffefa] dark:bg-[#0b100e] text-[#23372f] dark:text-[#e9f1ea]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 sm:px-9"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#244f3d] dark:bg-[#3d7a5c] text-xl text-white">⌂</span><span className="font-bold tracking-[-.04em]">Circuit Bungalow Finder</span></Link><div className="flex items-center gap-2"><ThemeToggle /><PageNav /></div></header>
      <div className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-9">
        {loading ? <p className="py-20 text-center text-sm text-[#718077] dark:text-[#9db0a2]">Loading bungalow details…</p> : error || !bungalow ? <section className="mt-10 rounded-3xl bg-[#f3f4ee] dark:bg-[#151f19] p-8 text-sm text-[#718077] dark:text-[#9db0a2]">{error || "Bungalow unavailable."}<p className="mt-4"><Link href="/" className="font-semibold text-[#315c46] dark:text-[#7fb894] underline">Return to search</Link></p></section> : <>
          <div className="mb-6 mt-7 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-5xl">{bungalow.name}</h1><p className="mt-3 text-sm text-[#718077] dark:text-[#9db0a2]">{bungalow.town}, {bungalow.district}{department && ` · ${department}`}</p></div><div className="flex items-center gap-3"><div className="text-sm font-semibold">{averageRating ? <><span className="text-[#c18b37] dark:text-[#d9a94f]">★</span> {averageRating.toFixed(1)} <span className="font-normal text-[#718077] dark:text-[#9db0a2]">· {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span></> : <span className="text-[#718077] dark:text-[#9db0a2]">No reviews yet</span>}</div><BookmarkButton bungalowId={bungalow.id} initialSaved={saved} variant="pill" /></div></div>

          {images.length ? <div className="grid max-h-[580px] gap-2 overflow-hidden rounded-[28px] sm:grid-cols-2"><div className="h-[300px] sm:h-[480px]"><img src={images[0]} alt={bungalow.name} fetchPriority="high" decoding="async" className="h-full w-full object-cover" /></div><div className="hidden grid-cols-2 grid-rows-2 gap-2 sm:grid">{images.slice(1, 5).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${bungalow.name} view ${index + 2}`} loading="lazy" decoding="async" className="h-full min-h-0 w-full object-cover" />)}{images.length === 1 && <div className="col-span-2 grid place-items-center bg-[#e8eee5] dark:bg-[#1d2b22] text-5xl text-[#9aab9c]">⌂</div>}</div></div> : <div className="grid h-72 place-items-center rounded-[28px] bg-[#e8eee5] dark:bg-[#1d2b22] text-6xl text-[#9aab9c] sm:h-[420px]">⌂</div>}

          {(bungalow.rooms_count != null || bungalow.max_guests != null || bungalow.ac_type || bungalow.price_info) && (
            <section aria-label="Property details" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {bungalow.rooms_count != null && (
                <div className="rounded-2xl border border-[#e8eae2] bg-white p-5 dark:border-[#223028] dark:bg-[#121a15]">
                  <p className="text-2xl" aria-hidden="true">🛏</p>
                  <p className="mt-2 text-lg font-bold tracking-tight">{bungalow.rooms_count} {bungalow.rooms_count === 1 ? "room" : "rooms"}</p>
                  <p className="mt-1 text-xs text-[#718077] dark:text-[#9db0a2]">Bedrooms</p>
                </div>
              )}
              {bungalow.max_guests != null && (
                <div className="rounded-2xl border border-[#e8eae2] bg-white p-5 dark:border-[#223028] dark:bg-[#121a15]">
                  <p className="text-2xl" aria-hidden="true">👥</p>
                  <p className="mt-2 text-lg font-bold tracking-tight">Up to {bungalow.max_guests}</p>
                  <p className="mt-1 text-xs text-[#718077] dark:text-[#9db0a2]">Guests</p>
                </div>
              )}
              {bungalow.ac_type && (
                <div className="rounded-2xl border border-[#e8eae2] bg-white p-5 dark:border-[#223028] dark:bg-[#121a15]">
                  <p className="text-2xl" aria-hidden="true">❄</p>
                  <p className="mt-2 text-lg font-bold tracking-tight">{bungalow.ac_type === "Non-AC" ? "Non-AC" : bungalow.ac_type === "Mixed" ? "Mixed AC" : "Air-conditioned"}</p>
                  <p className="mt-1 text-xs text-[#718077] dark:text-[#9db0a2]">Cooling</p>
                </div>
              )}
              {bungalow.price_info && (
                <div className="rounded-2xl border border-[#e8eae2] bg-white p-5 dark:border-[#223028] dark:bg-[#121a15]">
                  <p className="text-2xl" aria-hidden="true">💰</p>
                  <p className="mt-2 text-sm font-bold leading-6 tracking-tight">{bungalow.price_info}</p>
                  <p className="mt-1 text-xs text-[#718077] dark:text-[#9db0a2]">Rates & charges</p>
                </div>
              )}
            </section>
          )}
          <div className="mt-9 grid gap-10 lg:grid-cols-[1.4fr_.8fr]">
            <div>
              <section className="border-b border-[#e8eae2] dark:border-[#223028] pb-7"><h2 className="text-2xl font-semibold">About this bungalow</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#64766a] dark:text-[#a3b6a8]">{bungalow.description || "No description has been added yet."}</p></section>
              {bungalow.facilities?.length ? <section className="border-b border-[#e8eae2] dark:border-[#223028] py-7"><h2 className="text-xl font-semibold">Facilities</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{bungalow.facilities.map((facility) => <li key={facility} className="flex items-center gap-2 text-sm text-[#64766a] dark:text-[#a3b6a8]"><span className="text-[#315c46] dark:text-[#7fb894]">✓</span>{facility}</li>)}</ul></section> : null}
              <section className="border-b border-[#e8eae2] dark:border-[#223028] py-7"><h2 className="text-xl font-semibold">Location</h2><p className="mt-3 text-sm leading-6 text-[#64766a] dark:text-[#a3b6a8]">{bungalow.address || `${bungalow.town}, ${bungalow.district}`}</p>{bungalow.latitude && bungalow.longitude && <Link href="/map" className="mt-3 inline-block text-sm font-semibold text-[#315c46] dark:text-[#7fb894] underline">View all bungalows on map →</Link>}</section>
              <section className="border-b border-[#e8eae2] dark:border-[#223028] py-7"><h2 className="text-xl font-semibold">Reviews</h2><div className="mt-5"><ReviewForm key={bungalow.id} bungalowId={bungalow.id} onSubmitted={() => void loadReviews()} /></div><div className="mt-7 grid gap-5">{reviews.map((review, index) => <article key={`${review.created_at}-${index}`} className="rounded-2xl bg-[#f5f6f1] dark:bg-[#182219] p-5"><div className="flex items-center justify-between"><span className="tracking-widest text-[#c18b37] dark:text-[#d9a94f]">{"★".repeat(Math.max(0, Math.min(5, review.rating)))}<span className="text-[#d7ddd5] dark:text-[#2c3a31]">{"★".repeat(5 - Math.max(0, Math.min(5, review.rating)))}</span></span><time className="text-xs text-[#8a9b8b] dark:text-[#8fa393]">{new Date(review.created_at).toLocaleDateString()}</time></div>{review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#64766a] dark:text-[#a3b6a8]">{review.comment}</p>}</article>)}</div>{!reviews.length && <p className="mt-5 text-sm text-[#718077] dark:text-[#9db0a2]">Be the first to leave a review.</p>}</section>
            </div>

            <aside className="h-fit rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-6 shadow-[0_12px_36px_rgba(35,55,47,.07)]"><p className="text-xs font-bold uppercase tracking-[.17em] text-[#8a9b8b] dark:text-[#8fa393]">Official information</p><h2 className="mt-2 text-xl font-semibold">Contact & booking</h2>{phoneNumber ? <p className="mt-5 text-sm"><span className="block text-xs text-[#8a9b8b] dark:text-[#8fa393]">Phone</span><a className="mt-1 inline-block font-semibold text-[#315c46] dark:text-[#7fb894]" href={`tel:${phoneNumber}`}>{bungalow.contact_phone}</a></p> : <p className="mt-5 text-sm text-[#718077] dark:text-[#9db0a2]">No phone number listed.</p>}{bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block rounded-full bg-[#244f3d] dark:bg-[#3d7a5c] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#183d2e] dark:hover:bg-[#2c5a44]">Official booking information ↗</a>}{facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-sm font-semibold text-[#315c46] dark:text-[#7fb894] underline">Facebook page ↗</a>}<p className="mt-5 border-t border-[#ecece5] dark:border-[#223028] pt-4 text-xs leading-5 text-[#8a9b8b] dark:text-[#8fa393]">Contact details are provided by contributors. Confirm booking arrangements with the relevant department.</p></aside>
          </div>

          <section className="mt-12 rounded-3xl border border-[#e8eae2] dark:border-[#223028] bg-white dark:bg-[#121a15] p-6 sm:p-8"><h2 className="text-2xl font-semibold">Suggest an edit</h2><p className="mb-5 mt-2 text-sm text-[#718077] dark:text-[#9db0a2]">Help keep this listing accurate.</p><BungalowSuggestionForm key={bungalow.id} bungalow={bungalow} /></section>
        </>}
      </div>
    </main>
  );
}
