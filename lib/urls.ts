/** Accept only absolute web URLs before rendering contributor supplied links. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Keep phone links to characters accepted by the `tel:` URI scheme. */
export function safeTelephone(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return /^[+\d][\d\s().-]{2,24}$/.test(normalized) ? normalized : null;
}
