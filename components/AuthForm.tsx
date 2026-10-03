"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin";

type AuthFormProps = { mode: "login" | "signup" };

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f2] px-5 py-12 text-[#173b32]">
      <section className="w-full max-w-md rounded-3xl border border-[#e3e9df] bg-white p-8 shadow-[0_24px_70px_rgba(23,59,50,0.09)] sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#517466] hover:text-[#173b32]">
          ← Circuit Bungalow Finder
        </Link>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#819985]">
            Welcome {isSignup ? "aboard" : "back"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {isSignup ? "Create your account" : "Sign in to your account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6b7e74]">
            {isSignup
              ? "Save time planning your next stay across Sri Lanka."
              : "Pick up where you left off and plan your next stay."}
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => void signInWith("google")} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dce4dc] px-4 text-sm font-semibold hover:bg-[#f7f9f6] disabled:opacity-60">
            <span aria-hidden="true" className="text-base font-bold text-[#4285f4]">G</span> Google
          </button>
          <button type="button" disabled={busy} onClick={() => void signInWith("facebook")} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dce4dc] px-4 text-sm font-semibold hover:bg-[#f7f9f6] disabled:opacity-60">
            <span aria-hidden="true" className="text-base font-bold text-[#1877f2]">f</span> Facebook
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-[#9aa89d]">
          <span className="h-px flex-1 bg-[#e8ece7]" />
          or continue with email
          <span className="h-px flex-1 bg-[#e8ece7]" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            Email address
            <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-[#dce4dc] px-4 font-normal outline-none transition focus:border-[#527b67] focus:ring-4 focus:ring-[#527b67]/10" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="mt-2 h-12 w-full rounded-xl border border-[#dce4dc] px-4 font-normal outline-none transition focus:border-[#527b67] focus:ring-4 focus:ring-[#527b67]/10" />
          </label>
          <button disabled={busy} className="h-12 w-full rounded-xl bg-[#1d4d3e] px-5 text-sm font-semibold text-white transition hover:bg-[#153d31] disabled:cursor-wait disabled:opacity-60">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        {message && (
          <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-[#eef5ed] text-[#315d46]"}`}>
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-[#6b7e74]">
          {isSignup ? "Already have an account? " : "New to Circuit Bungalow Finder? "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-[#1d4d3e] hover:underline">
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
