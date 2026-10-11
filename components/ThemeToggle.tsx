"use client";

import { useState } from "react";

const STORAGE_KEY = "cbf-theme";

function initialDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(initialDark);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable; theme still applies for this visit */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#dce3dc] text-lg text-[#51655b] transition hover:bg-[#f5f6f1] dark:border-[#243830] dark:text-[#a9bcae] dark:hover:bg-[#182219]"
    >
      <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
    </button>
  );
}
