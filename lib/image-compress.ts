// Client-side image compression for community photo uploads.
// Shrinks photos to a sane size and converts to JPEG before they reach
// Supabase Storage, so the bucket does not fill up with 10MB phone photos.

export const MAX_UPLOAD_IMAGES = 4;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return `"${file.name}" is not an image file.`;
  if (file.size > MAX_ORIGINAL_BYTES) return `"${file.name}" is larger than 15MB.`;
  return null;
}

/** Compress an image to a JPEG blob. Falls back to the original on failure. */
export async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // White background so transparent PNGs do not turn black as JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
