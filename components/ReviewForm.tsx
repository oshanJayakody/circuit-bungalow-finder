"use client";

import { useState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { submitReview } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";

export default function ReviewForm({ bungalowId, onSubmitted }: { bungalowId: string; onSubmitted?: () => void }) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await submitReview(bungalowId, rating, comment.trim());
      setMessage("Your review was submitted.");
      setComment("");
      onSubmitted?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit your review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    signedIn ? <form className="grid gap-3" onSubmit={submit}>
      <div>
        <span id="review-rating-label" className="text-sm font-semibold">Rating</span>
        <div role="radiogroup" aria-labelledby="review-rating-label" className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = (hovered || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onFocus={() => setHovered(value)}
                onBlur={() => setHovered(0)}
                className="rounded p-1 text-3xl leading-none transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#315c46] dark:focus-visible:outline-[#7fb894]"
              >
                <span aria-hidden="true" className={active ? "text-[#c18b37] dark:text-[#d9a94f]" : "text-[#d8ddd3] dark:text-[#2c3a31]"}>★</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-sm text-[#718077] dark:text-[#9db0a2]">{rating} of 5 stars</p>
      </div>
      <label htmlFor="review-comment">Review</label>
      <textarea
        id="review-comment"
        className="rounded border p-3"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Share your experience (up to 2,000 characters)"
      />
      <button
        className="w-fit rounded bg-green-800 px-5 py-3 text-white disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Submitting..." : "Submit review"}
      </button>
      {message && <p role="status">{message}</p>}
    </form> : <p className="rounded-2xl bg-[#f3f4ee] dark:bg-[#151f19] p-4 text-sm text-[#718077] dark:text-[#9db0a2]">Sign in to leave a rating or review. <Link href="/login" className="font-semibold text-[#315c46] dark:text-[#7fb894] underline">Log in</Link></p>
  );
}
