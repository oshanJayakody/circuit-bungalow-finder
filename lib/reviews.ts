import { supabase } from "@/lib/supabase";

export async function submitReview(
  bungalowId: string,
  rating: number,
  comment: string
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in first.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }
  if (comment.length > 2000) throw new Error("Reviews must be 2,000 characters or fewer.");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      bungalow_id: bungalowId,
      user_id: user.id,
      rating,
      comment,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getBungalowReviews(bungalowId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("bungalow_id", bungalowId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return data;
}
