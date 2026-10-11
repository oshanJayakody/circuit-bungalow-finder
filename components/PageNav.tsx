"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PageNav() {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={goBack}
        className="rounded-full border border-[#dce3dc] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f6f1] dark:border-[#243830] dark:hover:bg-[#182219]"
      >
        ← Back
      </button>
      <Link
        href="/"
        aria-label="Home"
        title="Home"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#dce3dc] text-lg hover:bg-[#f5f6f1] dark:border-[#243830] dark:hover:bg-[#182219]"
      >
        <span aria-hidden="true">⌂</span>
      </Link>
    </div>
  );
}
