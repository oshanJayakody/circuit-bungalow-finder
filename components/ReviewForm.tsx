"use client";

import { useState } from "react";
import { submitReview } from "@/lib/reviews";

export default function ReviewForm({ bungalowId }: { bungalowId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await submitReview(bungalowId, rating, comment.trim());
      setMessage("Your review was submitted.");
      setComment("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit your review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
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
      />
      <button
        className="w-fit rounded bg-green-800 px-5 py-3 text-white disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Submitting..." : "Submit review"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
