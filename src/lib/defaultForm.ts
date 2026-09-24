import { generateId, generateToken } from "@/lib/ids";
import type { FormConfig } from "@/types";

export const DEFAULT_FORM_ID = "absensi-up3-kediri";

export function createBlankForm(
  overrides: Partial<FormConfig> = {},
): FormConfig {
  const now = new Date().toISOString();
  const id = overrides.id ?? generateId("kegiatan");
  const token = overrides.token ?? generateToken();

  return {
    title: "Kegiatan Absensi Baru",
    description: "",
    eventDate: new Date().toISOString().slice(0, 10),
    opensAt: null,
    closesAt: null,
    maxResponses: null,
    confirmationMessage:
      "Terima kasih. Absensi Anda berhasil dikirim dan telah tercatat.",
    pages: [
      {
        id: "pg1",
        title: "Data Diri",
        questionIds: ["nama", "unit_kerja"],
      },
      {
        id: "pg2",
        title: "Kehadiran",
        questionIds: ["tanggal", "status_hadir", "keperluan"],
      },
      {
        id: "pg3",
        title: "Tanda Tangan",
        questionIds: ["konfirmasi"],
      },
    ],
    questions: [
      {
        id: "nama",
        type: "text",
        label: "Nama Lengkap",
        required: true,
        placeholder: "cth: Budi Santoso",
      },
      {
        id: "unit_kerja",
        type: "select",
        label: "Unit Kerja",
        required: true,
        options: ["UP3 Kediri", "ULP", "Tim Khusus"],
      },
      {
        id: "tanggal",
        type: "date",
        label: "Tanggal Absensi",
        required: true,
      },
      {
        id: "status_hadir",
        type: "radio",
        label: "Status Kehadiran",
        required: true,
        options: ["Hadir", "Izin", "Sakit", "Dinas Luar"],
      },
      {
        id: "keperluan",
        type: "textarea",
        label: "Keperluan / Uraian Kegiatan",
        required: true,
        placeholder: "Uraian singkat kegiatan hari ini",
      },
      {
        id: "konfirmasi",
        type: "checkbox",
        label: "Pernyataan",
        required: true,
        options: ["Saya menyatakan data di atas benar"],
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
    id,
    token,
    status: overrides.status ?? "open",
  };
}

export const defaultFormConfig: FormConfig = createBlankForm({
  id: DEFAULT_FORM_ID,
  token: "devtokenabsensiup3kediri",
  title: "Formulir Absensi Pegawai",
  description:
    "Absensi resmi UP3 Kediri. Isi data dengan benar dan tanda tangani sebelum mengirim.",
  eventDate: new Date().toISOString().slice(0, 10),
  status: "open",
  pages: [
    {
      id: "pg1",
      title: "Data Pegawai",
      questionIds: ["nama", "nip", "unit_kerja", "jabatan"],
    },
    {
      id: "pg2",
      title: "Detail Kehadiran",
      questionIds: [
        "tanggal",
        "jam_masuk",
        "status_hadir",
        "keperluan",
        "lokasi",
      ],
    },
    {
      id: "pg3",
      title: "Konfirmasi & Tanda Tangan",
      questionIds: ["konfirmasi"],
    },
  ],
  questions: [
    {
      id: "nama",
      type: "text",
      label: "Nama Lengkap",
      required: true,
      placeholder: "cth: Budi Santoso",
    },
    {
      id: "nip",
      type: "text",
      label: "NIP / NIK",
      required: true,
      placeholder: "cth: 198001012005011001",
    },
    {
      id: "unit_kerja",
      type: "select",
      label: "Unit Kerja",
      required: true,
      options: [
        "UP3 Kediri",
        "ULP Kediri Kota",
        "ULP Pare",
        "ULP Nganjuk",
        "ULP Blitar",
        "ULP Tulungagung",
        "ULP Kertosono",
      ],
    },
    {
      id: "jabatan",
      type: "text",
      label: "Jabatan",
      required: false,
      placeholder: "cth: Supervisor / Pelaksana",
    },
    {
      id: "tanggal",
      type: "date",
      label: "Tanggal Absensi",
      required: true,
    },
    {
      id: "jam_masuk",
      type: "time",
      label: "Jam Masuk",
      required: false,
    },
    {
      id: "status_hadir",
      type: "radio",
      label: "Status Kehadiran",
      required: true,
      options: ["Hadir", "Izin", "Sakit", "Dinas Luar", "Cuti", "WFH"],
    },
    {
      id: "keperluan",
      type: "textarea",
      label: "Keperluan / Uraian Kegiatan",
      required: true,
      placeholder: "Uraian singkat pekerjaan hari ini",
    },
    {
      id: "lokasi",
      type: "text",
      label: "Lokasi Penugasan",
      required: false,
      placeholder: "cth: Kantor UP3 / lokasi pelanggan",
    },
    {
      id: "konfirmasi",
      type: "checkbox",
      label: "Pernyataan",
      required: true,
      options: ["Saya menyatakan data di atas benar"],
    },
  ],
});
