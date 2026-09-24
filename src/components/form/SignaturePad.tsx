"use client";

import { useEffect, useRef } from "react";

interface SignaturePadProps {
  onChange?: (dataUrl: string | null) => void;
  className?: string;
}

export default function SignaturePad({
  onChange,
  className = "",
}: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onChangeRef = useRef(onChange);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const existing = hasStrokeRef.current
        ? canvas.toDataURL("image/png")
        : null;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (existing) {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0, width, height);
        };
        image.src = existing;
      }
    };

    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const styleStroke = () => {
      ctx.strokeStyle = "#0c1a2b";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      drawingRef.current = true;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        /* pointer capture opsional */
      }
      styleStroke();
      const { x, y } = point(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.01, y + 0.01);
      ctx.stroke();
      hasStrokeRef.current = true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!drawingRef.current) return;
      const { x, y } = point(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* release opsional */
      }
      onChangeRef.current?.(
        hasStrokeRef.current ? canvas.toDataURL("image/png") : null,
      );
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerEnd);
    canvas.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerEnd);
      canvas.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    hasStrokeRef.current = false;
    onChangeRef.current?.(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={containerRef}
        className="touch-none h-48 w-full overflow-hidden rounded-lg border border-slate-300 bg-white"
      >
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Gunakan jari di HP atau mouse di PC untuk menandatangani.
        </p>
        <button
          type="button"
          onClick={clear}
          className="btn btn-secondary btn-sm"
        >
          Hapus tanda tangan
        </button>
      </div>
    </div>
  );
}
