"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { submitBungalow } from "@/lib/bungalows";
import { districtTowns, sriLankanDistricts } from "@/lib/sri-lanka-locations";
import { supabase } from "@/lib/supabase";

type Department = { id: number; name: string };

export default function BungalowSubmissionForm({ departments }: { departments: Department[] }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [district, setDistrict] = useState("");
  const [town, setTown] = useState("");
  const [customTown, setCustomTown] = useState("");
  const [departmentValue, setDepartmentValue] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [addedDepartments, setAddedDepartments] = useState<Department[]>([]);
  const availableDepartments = [...departments, ...addedDepartments].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);
  const [availableDistricts, setAvailableDistricts] = useState(sriLankanDistricts);
  const [availableTowns, setAvailableTowns] = useState(districtTowns);

  useEffect(() => {
    void Promise.all([
      supabase.from("sri_lanka_districts").select("name").order("name"),
      supabase.from("sri_lanka_towns").select("district_name, name").order("name"),
    ]).then(([districtResult, townResult]) => {
      if (!districtResult.error && districtResult.data?.length) {
        setAvailableDistricts(districtResult.data.map((item) => item.name));
      }
      if (!townResult.error && townResult.data?.length) {
        const grouped: Record<string, string[]> = {};
        for (const item of townResult.data) (grouped[item.district_name] ??= []).push(item.name);
        setAvailableTowns(grouped);
      }
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      let departmentId: number;
      if (departmentValue === "__other") {
        const name = customDepartment.trim();
        if (!name) throw new Error("Enter a department name.");
        const match = availableDepartments.find((item) => item.name.toLowerCase() === name.toLowerCase());
        if (match) {
          departmentId = match.id;
        } else {
          const { data, error } = await supabase.from("departments").insert({ name }).select("id, name").single();
          if (error) throw new Error(`Unable to add department: ${error.message}`);
          departmentId = data.id;
          setAddedDepartments((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } else {
        departmentId = Number(departmentValue);
      }
      await submitBungalow({
        name: String(values.get("name")).trim(),
        district,
        town: town === "__other" ? customTown.trim() : town,
        department_id: departmentId,
        address: String(values.get("address")).trim() || undefined,
        description: String(values.get("description")).trim() || undefined,
        contact_phone: String(values.get("contact_phone")).trim() || undefined,
        booking_url: String(values.get("booking_url")).trim() || undefined,
      });
      form.reset();
      setDistrict("");
      setTown("");
      setCustomTown("");
      setDepartmentValue("");
      setCustomDepartment("");
      setMessage("Listing submitted for review. It will appear after approval.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit listing.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded border p-3";
  return (
    <section className="my-10 rounded-xl border bg-white dark:bg-[#121a15] p-6">
      <h2 className="mb-2 text-2xl font-semibold">Add a circuit bungalow</h2>
      <p className="mb-5 text-gray-600">Share a listing with the community. Submissions are reviewed before they appear in search.</p>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <label className="grid gap-1">Bungalow name<input className={inputClass} name="name" maxLength={160} required /></label>
        <label className="grid gap-1">Department<select className={inputClass} name="department_id" required value={departmentValue} onChange={(event) => setDepartmentValue(event.target.value)}><option value="" disabled>Select a department</option>{availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}<option value="__other">Other department…</option></select></label>
        {departmentValue === "__other" && <label className="grid gap-1">Enter department name<input className={inputClass} name="custom_department" value={customDepartment} onChange={(event) => setCustomDepartment(event.target.value)} maxLength={120} required /></label>}
        <label className="grid gap-1">District<select className={inputClass} name="district" required value={district} onChange={(event) => { setDistrict(event.target.value); setTown(""); setCustomTown(""); }}><option value="" disabled>Select a district</option>{availableDistricts.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="grid gap-1">Town / area<select className={inputClass} name="town" required disabled={!district} value={town} onChange={(event) => setTown(event.target.value)}><option value="" disabled>{district ? "Select a town / area" : "Choose a district first"}</option>{(availableTowns[district] ?? []).map((name) => <option key={name} value={name}>{name}</option>)}<option value="__other">Other town / area…</option></select></label>
        {town === "__other" && <label className="grid gap-1 md:col-span-2">Enter town / area<input className={inputClass} name="custom_town" maxLength={120} value={customTown} onChange={(event) => setCustomTown(event.target.value)} required /></label>}
        <label className="grid gap-1 md:col-span-2">Address<input className={inputClass} name="address" maxLength={500} /></label>
        <label className="grid gap-1 md:col-span-2">Description<textarea className={inputClass} name="description" rows={3} maxLength={2000} /></label>
        <label className="grid gap-1">Contact phone<input className={inputClass} name="contact_phone" type="tel" maxLength={32} /></label>
        <label className="grid gap-1">Booking URL<input className={inputClass} name="booking_url" type="url" maxLength={2048} /></label>
        <button className="w-fit rounded bg-green-800 px-6 py-3 text-white disabled:opacity-60 md:col-span-2" disabled={saving} type="submit">{saving ? "Submitting…" : "Submit bungalow"}</button>
      </form>
      {message && <p className="mt-4" role="status">{message}</p>}
    </section>
  );
}
