export function buildCsvRows(
  headers: string[],
  rows: (string | number)[][],
): string {
  const escape = (value: string | number): string => {
    const raw = String(value ?? "");
    const text = raw.startsWith("data:")
      ? "[gambar tanda tangan, lihat di aplikasi]"
      : raw;
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  return [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}

export function downloadTextFile(
  fileName: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob(["\ufeff", content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
