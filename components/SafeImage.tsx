"use client";

import { useState } from "react";
import type { ReactNode } from "react";

// Image with graceful degradation: if the source URL is dead (some older
// listing photos no longer resolve), render the fallback instead of a
// broken-image box.
export default function SafeImage({
  src,
  alt,
  className,
  eager,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback ?? null}</>;
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
