"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import PageNav from "@/components/PageNav";
import { supabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin";
import { useLanguage } from "@/lib/i18n";

type AuthFormProps = { mode: "login" | "signup" };

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      setIsError(Boolean(result.error));
      if (!result.error && !isSignup) {
        window.location.assign(await isAdminUser(result.data.user) ? "/admin" : "/");
        return;
      }
      setMessage(result.error?.message ?? "Account created. Check your email to confirm your address.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWith(provider: "google" | "facebook") {
    setBusy(true);
    setMessage("");
    window.sessionStorage.setItem("admin-oauth-pending", "true");
    try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      window.sessionStorage.removeItem("admin-oauth-pending");
      setBusy(false);
      setIsError(true);
      setMessage(error.message);
    }
    } catch (error) {
      window.sessionStorage.removeItem("admin-oauth-pending");
      setBusy(false);
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to start sign-in.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f2] dark:bg-[#151f19] px-5 py-12 text-[#173b32] dark:text-[#2c5a44]">
      <section className="w-full max-w-md rounded-3xl border border-[#e3e9df] dark:border-[#223028] bg-white dark:bg-[#121a15] p-8 shadow-[0_24px_70px_rgba(23,59,50,0.09)] sm:p-10">
        <PageNav />
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#819985] dark:text-[#8ba391]">
            {isSignup ? t("au_welcome_aboard") : t("au_welcome_back")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {isSignup ? t("au_signup_title") : t("au_login_title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6b7e74] dark:text-[#9db0a2]">
            {isSignup ? t("au_signup_sub") : t("au_login_sub")}
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => void signInWith("google")} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dce4dc] dark:border-[#243830] px-4 text-sm font-semibold hover:bg-[#f7f9f6] dark:hover:bg-[#151f19] disabled:opacity-60">
            <span aria-hidden="true" className="text-base font-bold text-[#4285f4]">G</span> Google
          </button>
          <button type="button" disabled={busy} onClick={() => void signInWith("facebook")} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dce4dc] dark:border-[#243830] px-4 text-sm font-semibold hover:bg-[#f7f9f6] dark:hover:bg-[#151f19] disabled:opacity-60">
            <span aria-hidden="true" className="text-base font-bold text-[#1877f2]">f</span> Facebook
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-[#9aa89d] dark:text-[#8fa393]">
          <span className="h-px flex-1 bg-[#e8ece7] dark:bg-[#223028]" />
          {t("au_or_email")}
          <span className="h-px flex-1 bg-[#e8ece7] dark:bg-[#223028]" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            {t("au_email")}
            <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-[#dce4dc] dark:border-[#243830] px-4 font-normal outline-none transition focus:border-[#527b67] dark:focus:border-[#8fb89b] focus:ring-4 focus:ring-[#527b67]/10 dark:focus:ring-[#8fb89b]/10" />
          </label>
          <label className="block text-sm font-semibold">
            {t("au_password")}
            <input required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("au_password_ph")} className="mt-2 h-12 w-full rounded-xl border border-[#dce4dc] dark:border-[#243830] px-4 font-normal outline-none transition focus:border-[#527b67] dark:focus:border-[#8fb89b] focus:ring-4 focus:ring-[#527b67]/10 dark:focus:ring-[#8fb89b]/10" />
          </label>
          <button disabled={busy} className="h-12 w-full rounded-xl bg-[#1d4d3e] dark:bg-[#3d7a5c] px-5 text-sm font-semibold text-white transition hover:bg-[#153d31] dark:hover:bg-[#2c5a44] disabled:cursor-wait disabled:opacity-60">
            {busy ? t("au_wait") : isSignup ? t("au_signup_btn") : t("au_signin_btn")}
          </button>
        </form>

        {message && (
          <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300" : "bg-[#eef5ed] dark:bg-[#1d2b22] text-[#315d46] dark:text-[#7fb894]"}`}>
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-[#6b7e74] dark:text-[#9db0a2]">
          {isSignup ? t("au_have_account") : t("au_new_here")}{" "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-[#1d4d3e] dark:text-[#3d7a5c] hover:underline">
            {isSignup ? t("au_signin_link") : t("au_signup_link")}
          </Link>
        </p>
      </section>
    </main>
  );
}
