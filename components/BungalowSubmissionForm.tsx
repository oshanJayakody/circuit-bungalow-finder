"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { submitBungalow } from "@/lib/bungalows";
import { districtTowns, sriLankanDistricts } from "@/lib/sri-lanka-locations";
import { compressImage, validateImageFile, MAX_UPLOAD_IMAGES } from "@/lib/image-compress";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

type Department = { id: number; name: string };

export default function BungalowSubmissionForm({ departments }: { departments: Department[] }) {
  const [message, setMessage] = useState("");
  const { t } = useLanguage();
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
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    const next = [...images];
    for (const file of files) {
      if (next.length >= MAX_UPLOAD_IMAGES) {
        setMessage(t("f_max_photos", { n: MAX_UPLOAD_IMAGES }));
        break;
      }
      const problem = validateImageFile(file);
      if (problem) {
        setMessage(problem);
        continue;
      }
      if (next.some((item) => item.file.name === file.name && item.file.size === file.size)) continue;
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages(next);
  }

  function removeImage(index: number) {
    setImages((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in before submitting a listing.");
      let image_urls: string[] | undefined;
      if (images.length > 0) {
        const urls: string[] = [];
        for (const [index, item] of images.entries()) {
          setMessage(`Uploading photo ${index + 1} of ${images.length}…`);
          const blob = await compressImage(item.file);
          const path = `${user.id}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("bungalow-images")
            .upload(path, blob, { contentType: "image/jpeg", upsert: false });
          if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
          urls.push(supabase.storage.from("bungalow-images").getPublicUrl(path).data.publicUrl);
        }
        image_urls = urls;
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
        image_urls,
      });
      form.reset();
      for (const item of images) URL.revokeObjectURL(item.preview);
      setImages([]);
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
      <h2 className="mb-2 text-2xl font-semibold">{t("form_title")}</h2>
      <p className="mb-5 text-gray-600">{t("form_sub")}</p>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <label className="grid gap-1">{t("f_name")}<input className={inputClass} name="name" maxLength={160} required /></label>
        <label className="grid gap-1">{t("f_department")}<select className={inputClass} name="department_id" required value={departmentValue} onChange={(event) => setDepartmentValue(event.target.value)}><option value="" disabled>{t("f_select_department")}</option>{availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}<option value="__other">{t("f_other_department")}</option></select></label>
        {departmentValue === "__other" && <label className="grid gap-1">{t("f_enter_department")}<input className={inputClass} name="custom_department" value={customDepartment} onChange={(event) => setCustomDepartment(event.target.value)} maxLength={120} required /></label>}
        <label className="grid gap-1">{t("f_district")}<select className={inputClass} name="district" required value={district} onChange={(event) => { setDistrict(event.target.value); setTown(""); setCustomTown(""); }}><option value="" disabled>{t("f_select_district")}</option>{availableDistricts.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="grid gap-1">{t("f_town")}<select className={inputClass} name="town" required disabled={!district} value={town} onChange={(event) => setTown(event.target.value)}><option value="" disabled>{district ? t("f_select_town") : t("f_choose_district_first")}</option>{(availableTowns[district] ?? []).map((name) => <option key={name} value={name}>{name}</option>)}<option value="__other">{t("f_other_town")}</option></select></label>
        {town === "__other" && <label className="grid gap-1 md:col-span-2">{t("f_enter_town")}<input className={inputClass} name="custom_town" maxLength={120} value={customTown} onChange={(event) => setCustomTown(event.target.value)} required /></label>}
        <label className="grid gap-1 md:col-span-2">{t("f_address")}<input className={inputClass} name="address" maxLength={500} /></label>
        <label className="grid gap-1 md:col-span-2">{t("f_description")}<textarea className={inputClass} name="description" rows={3} maxLength={2000} /></label>
        <label className="grid gap-1">{t("f_phone")}<input className={inputClass} name="contact_phone" type="tel" maxLength={32} /></label>
        <label className="grid gap-1">{t("f_booking_url")}<input className={inputClass} name="booking_url" type="url" maxLength={2048} /></label>
        <label className="grid gap-1 md:col-span-2">{t("f_photos", { n: MAX_UPLOAD_IMAGES })}
          <input type="file" accept="image/*" multiple className={inputClass} onChange={handleFiles} />
          <span className="text-xs font-normal text-gray-500">{t("f_photos_hint")}</span>
        </label>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 md:col-span-2">
            {images.map((item, index) => (
              <div key={`${item.file.name}-${index}`} className="relative">
                <img src={item.preview} alt={`Photo preview ${index + 1}`} className="h-24 w-24 rounded-lg object-cover" />
                <button type="button" onClick={() => removeImage(index)} aria-label={`Remove photo ${index + 1}`} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white">✕</button>
              </div>
            ))}
          </div>
        )}
        <button className="w-fit rounded bg-green-800 px-6 py-3 text-white disabled:opacity-60 md:col-span-2" disabled={saving} type="submit">{saving ? t("f_submitting") : t("f_submit")}</button>
      </form>
      {message && <p className="mt-4" role="status">{message}</p>}
    </section>
  );
}
