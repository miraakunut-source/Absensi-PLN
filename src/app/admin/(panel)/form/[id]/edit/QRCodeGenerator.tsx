"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import Button from "@/components/ui/Button";

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
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-md border border-line bg-surface p-4 shadow-panel">
        <QRCodeCanvas
          ref={canvasRef}
          value={value}
          size={size}
          level="M"
          marginSize={2}
        />
      </div>
      <p className="type-caption max-w-[220px] break-all text-center font-mono">
        {value}
      </p>
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={download}
      >
        Unduh QR Code
      </Button>
    </div>
  );
}
