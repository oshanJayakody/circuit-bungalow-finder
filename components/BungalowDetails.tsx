"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";
import BungalowSuggestionForm from "@/components/BungalowSuggestionForm";
import { getBungalowReviews } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";
import { safeHttpUrl, safeTelephone } from "@/lib/urls";
import ThemeToggle from "@/components/ThemeToggle";
import SiteLogo from "@/components/SiteLogo";
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

function amenityIcon(name: string): string {
  const n = name.toLowerCase();
  if (/wifi|wi-fi|internet/.test(n)) return "📶";
  if (/parking/.test(n)) return "🅿️";
  if (/pool|swim/.test(n)) return "🏊";
  if (/kitchen/.test(n)) return "🍳";
  if (/meal|restaurant|catering|dining|food|breakfast|cook/.test(n)) return "🍽️";
  if (/hot water|geyser/.test(n)) return "🚿";
  if (/\btv\b|television/.test(n)) return "📺";
  if (/air[- ]?condition|\bac\b/.test(n)) return "❄️";
  if (/fan/.test(n)) return "🌀";
  if (/generator|power|backup|electric/.test(n)) return "🔌";
  if (/caretaker|staff|service/.test(n)) return "🛎️";
  if (/laundry|wash/.test(n)) return "🧺";
  if (/garden|lawn/.test(n)) return "🌳";
  if (/veranda|balcony|terrace/.test(n)) return "🏡";
  if (/secur/.test(n)) return "🛡️";
  if (/conference|hall|meeting/.test(n)) return "🏢";
  if (/bbq|barbecue/.test(n)) return "🍖";
  if (/beach/.test(n)) return "🏖️";
  if (/gym|fitness/.test(n)) return "🏋️";
  if (/pet|dog/.test(n)) return "🐾";
  if (/workspace|desk/.test(n)) return "💻";
  return "✓";
}

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
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const images = bungalow?.image_urls?.filter((image): image is string => Boolean(safeHttpUrl(image))).slice(0, 5) ?? [];
  const bookingUrl = safeHttpUrl(bungalow?.booking_url);
  const facebookUrl = safeHttpUrl(bungalow?.facebook_url);
  const phoneNumber = safeTelephone(bungalow?.contact_phone);

  // Airbnb-style summary strip: guests · bedrooms · cooling · rates.
  const summaryBits: React.ReactNode[] = [];
  if (bungalow?.max_guests != null) summaryBits.push(<span key="guests"><span aria-hidden="true">👥 </span>Up to {bungalow.max_guests} guests</span>);
  if (bungalow?.rooms_count != null) summaryBits.push(<span key="rooms"><span aria-hidden="true">🛏 </span>{bungalow.rooms_count} {bungalow.rooms_count === 1 ? "bedroom" : "bedrooms"}</span>);
  if (bungalow?.ac_type) summaryBits.push(<span key="ac"><span aria-hidden="true">❄️ </span>{bungalow.ac_type === "Non-AC" ? "Non-AC" : bungalow.ac_type === "Mixed" ? "Mixed AC" : "Air conditioning"}</span>);
  if (bungalow?.price_info) summaryBits.push(<span key="price"><span aria-hidden="true">🏷️ </span>{bungalow.price_info}</span>);

  return (
    <main className="min-h-screen bg-[#fffefa] dark:bg-[#0b100e] text-[#23372f] dark:text-[#e9f1ea]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 sm:px-9"><Link href="/" className="flex items-center gap-3"><SiteLogo /><span className="font-bold tracking-[-.04em]">Circuit Bungalow Finder</span></Link><div className="flex items-center gap-2"><ThemeToggle /><PageNav /></div></header>
      <div className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-9">
        {loading ? <p className="py-20 text-center text-sm text-[#718077] dark:text-[#9db0a2]">Loading bungalow details…</p> : error || !bungalow ? <section className="mt-10 rounded-3xl bg-[#f3f4ee] dark:bg-[#151f19] p-8 text-sm text-[#718077] dark:text-[#9db0a2]">{error || "Bungalow unavailable."}<p className="mt-4"><Link href="/" className="font-semibold text-[#315c46] dark:text-[#7fb894] underline">Return to search</Link></p></section> : <>
          <div className="mb-6 mt-7 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-5xl">{bungalow.name}</h1><p className="mt-3 text-sm font-semibold">{averageRating ? <><span><span className="text-[#c18b37] dark:text-[#d9a94f]">★</span> {averageRating.toFixed(1)}</span><span className="font-normal text-[#718077] dark:text-[#9db0a2]"> · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span></> : <span className="font-normal text-[#718077] dark:text-[#9db0a2]">New · No reviews yet</span>}<span className="font-normal text-[#718077] dark:text-[#9db0a2]"> · {bungalow.town}, {bungalow.district}, Sri Lanka</span></p>{department && <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a9b8b] dark:text-[#8fa393]">{department}</p>}</div><BookmarkButton bungalowId={bungalow.id} initialSaved={saved} variant="pill" /></div>

          {images.length ? <div className="grid max-h-[580px] gap-2 overflow-hidden rounded-[28px] sm:grid-cols-2"><div className="h-[300px] sm:h-[480px]"><img src={images[0]} alt={bungalow.name} fetchPriority="high" decoding="async" className="h-full w-full object-cover" /></div><div className="hidden grid-cols-2 grid-rows-2 gap-2 sm:grid">{images.slice(1, 5).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${bungalow.name} view ${index + 2}`} loading="lazy" decoding="async" className="h-full min-h-0 w-full object-cover" />)}{images.length === 1 && <div className="col-span-2 grid place-items-center bg-[#e8eee5] dark:bg-[#1d2b22] text-5xl text-[#9aab9c]">⌂</div>}</div></div> : <div className="grid h-72 place-items-center rounded-[28px] bg-[#e8eee5] dark:bg-[#1d2b22] text-6xl text-[#9aab9c] sm:h-[420px]">⌂</div>}

          {summaryBits.length > 0 && (
            <p className="mt-6 flex flex-wrap items-center gap-y-2 text-[15px] font-semibold">
              {summaryBits.map((bit, index) => (
                <span key={index} className="flex items-center">
                  {index > 0 && <span aria-hidden="true" className="mx-3 font-normal text-[#9aa69e] dark:text-[#6f8175]">·</span>}
                  {bit}
                </span>
              ))}
            </p>
          )}
          <div className="mt-9 grid gap-10 lg:grid-cols-[1.4fr_.8fr]">
            <div>
              <section className="border-b border-[#e8eae2] dark:border-[#223028] pb-7"><h2 className="text-2xl font-semibold">About this bungalow</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#64766a] dark:text-[#a3b6a8]">{bungalow.description || "No description has been added yet."}</p></section>
              {bungalow.facilities?.length ? <section className="border-b border-[#e8eae2] dark:border-[#223028] py-7"><h2 className="text-xl font-semibold">What this place offers</h2><ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{(showAllAmenities ? bungalow.facilities : bungalow.facilities.slice(0, 8)).map((facility) => <li key={facility} className="flex items-center gap-4 text-[15px] text-[#23372f] dark:text-[#e9f1ea]"><span aria-hidden="true" className="text-2xl">{amenityIcon(facility)}</span>{facility}</li>)}</ul>{bungalow.facilities.length > 8 && <button type="button" onClick={() => setShowAllAmenities((v) => !v)} className="mt-6 rounded-xl border border-[#23372f] dark:border-[#e9f1ea] px-6 py-3 text-sm font-semibold transition hover:bg-[#f5f6f1] dark:hover:bg-[#182219]">{showAllAmenities ? "Show fewer amenities" : `Show all ${bungalow.facilities.length} amenities`}</button>}</section> : null}
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
