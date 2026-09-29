"use client";

import { useRef, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

const MAX_WIDTH = 1400;
const MAX_HEIGHT = 800;

interface ImageBackgroundControlProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar"));
    reader.readAsDataURL(file);
  });
}

async function resizeImage(dataUrl: string): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Gambar tidak dapat diproses"));
    element.src = dataUrl;
  });

  const ratio = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pemrosesan gambar");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function ImageBackgroundControl({
  value,
  onChange,
}: ImageBackgroundControlProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Berkas harus berupa gambar (JPG atau PNG).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      const resized = await resizeImage(dataUrl);
      if (resized.length > 900_000) {
        setError(
          "Ukuran gambar masih terlalu besar. Pilih gambar dengan resolusi lebih kecil.",
        );
        return;
      }
      onChange(resized);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal memproses gambar.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Gambar latar saat ini"
            className="h-10 w-20 rounded border border-line object-cover"
          />
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
          }}
        />
        <Button
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Memproses..." : "Image Background"}
        </Button>
        {value ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => onChange(null)}
            disabled={busy}
          >
            Hapus
          </Button>
        ) : null}
      </div>
      {error ? (
        <div className="w-full max-w-sm">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}
