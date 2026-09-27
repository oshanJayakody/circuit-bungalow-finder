
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function register() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setMessage(
      error ? error.message : "Check your email to confirm your account."
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-5 text-2xl font-bold">Create an account</h1>

      <input
        className="mb-4 w-full rounded border p-3"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="mb-4 w-full rounded border p-3"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="rounded bg-green-800 px-5 py-3 text-white"
        onClick={register}
      >
        Sign up
      </button>

      <p className="mt-4">{message}</p>
    </main>
  );
}