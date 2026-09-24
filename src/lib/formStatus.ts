import type { FormConfig, FormOpenState } from "@/types";

export function getFormOpenState(
  config: Pick<
    FormConfig,
    "status" | "opensAt" | "closesAt" | "maxResponses"
  >,
  responseCount?: number,
): FormOpenState {
  if (config.status === "closed") {
    return "closed_manual";
  }

  const now = Date.now();

  if (config.opensAt) {
    const starts = new Date(config.opensAt).getTime();
    if (!Number.isNaN(starts) && now < starts) {
      return "not_started";
    }
  }

  if (config.closesAt) {
    const ends = new Date(config.closesAt).getTime();
    if (!Number.isNaN(ends) && now > ends) {
      return "deadline_passed";
    }
  }

  if (
    typeof config.maxResponses === "number" &&
    config.maxResponses > 0 &&
    typeof responseCount === "number" &&
    responseCount >= config.maxResponses
  ) {
    return "max_reached";
  }

  return "open";
}

export function getOpenStateMessage(state: FormOpenState): string {
  switch (state) {
    case "closed_manual":
      return "Form sudah ditutup oleh admin.";
    case "not_started":
      return "Form belum dibuka. Silakan kembali sesuai jadwal.";
    case "deadline_passed":
      return "Batas waktu pengisian absen ini sudah berakhir.";
    case "max_reached":
      return "Kuota peserta untuk kegiatan ini sudah penuh.";
    default:
      return "";
  }
}

export function isFormOpen(
  config: Parameters<typeof getFormOpenState>[0],
  responseCount?: number,
): boolean {
  return getFormOpenState(config, responseCount) === "open";
}
