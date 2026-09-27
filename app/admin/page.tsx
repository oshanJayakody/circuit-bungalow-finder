"use client";

import { useState } from "react";
import { approveBungalow } from "@/lib/bungalows";

export default function AdminPage() {
  const [bungalowId, setBungalowId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function approve() {
    if (!bungalowId.trim()) {
      setMessage("Enter a bungalow ID.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await approveBungalow(bungalowId.trim());
      setMessage("Bungalow approved.");
      setBungalowId("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to approve bungalow.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-5 text-2xl font-bold">Approve a bungalow</h1>
      <label className="mb-2 block" htmlFor="bungalow-id">Bungalow ID</label>
      <input
        id="bungalow-id"
        className="mb-4 w-full rounded border p-3"
        value={bungalowId}
        onChange={(event) => setBungalowId(event.target.value)}
        placeholder="Enter the submitted bungalow ID"
      />
      <button
        className="rounded bg-green-800 px-5 py-3 text-white disabled:opacity-60"
        disabled={saving}
        onClick={approve}
      >
        {saving ? "Approving..." : "Approve"}
      </button>
      {message && <p className="mt-4" role="status">{message}</p>}
    </main>
  );
}
