"use client";

import { useState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { submitReview } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";

export default function ReviewForm({ bungalowId, onSubmitted }: { bungalowId: string; onSubmitted?: () => void }) {
  const [rating, setRating] = useState(5);
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
      <label htmlFor="review-rating">Rating</label>
      <select
        id="review-rating"
        className="rounded border p-3"
        value={rating}
        onChange={(event) => setRating(Number(event.target.value))}
      >
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>{value} {value === 1 ? "star" : "stars"}</option>
        ))}
      </select>
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
    </form> : <p className="rounded-2xl bg-[#f3f4ee] p-4 text-sm text-[#718077]">Sign in to leave a rating or review. <Link href="/login" className="font-semibold text-[#315c46] underline">Log in</Link></p>
  );
}
