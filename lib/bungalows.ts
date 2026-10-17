import { supabase } from "@/lib/supabase";

export async function submitBungalow(form: {
  name: string;
  district: string;
  town: string;
  department_id: number;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  booking_url?: string;
  facebook_url?: string;
  facilities?: string[];
  image_urls?: string[];
}) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in before submitting a listing.");
  }

  const { data, error } = await supabase
    .from("bungalows")
    .insert({
      ...form,
      submitted_by: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function approveBungalow(bungalowId: string) {
  const { error } = await supabase
    .from("bungalows")
    .update({ status: "approved" })
    .eq("id", bungalowId);

  if (error) throw error;
}
