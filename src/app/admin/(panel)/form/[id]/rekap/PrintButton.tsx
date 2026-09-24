"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      Cetak atau simpan PDF
    </button>
  );
}
