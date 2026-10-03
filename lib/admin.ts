import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = new Set(["kusalankaoshan@gmail.com"]);

export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  const email = user.email?.trim().toLowerCase();
  if (user.app_metadata?.role === "admin" || (user.email_confirmed_at && email && ADMIN_EMAILS.has(email))) return true;

  const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return !error && data?.role === "admin";
}
