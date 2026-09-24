"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export default function QRCodeGenerator({
  value,
  size = 200,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code-absensi.png";
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="rounded-lg bg-white p-2">
        <QRCodeCanvas
          ref={canvasRef}
          value={value}
          size={size}
          level="M"
          marginSize={2}
        />
      </div>
      <p className="max-w-[220px] break-all text-center font-mono text-[11px] text-slate-500">
        {value}
      </p>
      <button type="button" onClick={download} className="btn btn-secondary btn-sm w-full">
        Unduh QR Code
      </button>
    </div>
  );
}
