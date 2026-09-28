"use client";

import { useState } from "react";
import type { FormResponse } from "@/types";

function signatureSources(row: FormResponse): string[] {
  const sources: string[] = [];
  if (row.signatureUrl) {
    sources.push(
      `/api/signature/image?id=${encodeURIComponent(row.signatureUrl)}`,
    );
  }
  if (row.signatureDataUrl) {
    sources.push(row.signatureDataUrl);
  }
  return sources;
}

interface SignatureImageProps {
  row: FormResponse;
  className?: string;
  alt: string;
}

export default function SignatureImage({
  row,
  className,
  alt,
}: SignatureImageProps) {
  const sources = signatureSources(row);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const exhausted = failed || index >= sources.length;

  if (sources.length === 0 || exhausted) {
    return <p className="type-caption">Gambar tanda tangan tidak tersedia</p>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={row.id}
      src={sources[index]}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (index + 1 < sources.length) {
          setIndex(index + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
