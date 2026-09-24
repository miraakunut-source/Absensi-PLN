import Link from "next/link";
import PlnMark from "@/components/brand/PlnMark";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-4 border-gold-500 bg-brand-800 text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <PlnMark inverted />
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Absensi kegiatan UP3 Kediri
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Pengganti Google Form untuk absensi resmi. Peserta cukup memindai
            QR Code kegiatan — tanpa login. Admin masuk melalui tombol di
            bawah.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="panel rounded-xl p-6">
          <h2 className="panel-title">Akses admin</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Halaman dashboard, editor form, dan rekap absensi dilindungi
            Firebase Auth. Peserta tidak perlu masuk ke halaman ini.
          </p>
          <Link href="/admin/login" className="btn btn-primary mt-5">
            Masuk ke dashboard admin
          </Link>
        </div>

        <div className="panel mt-6 rounded-xl p-6">
          <h2 className="panel-title">Untuk peserta</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Buka form absensi lewat QR Code yang dibagikan panitia. Tautan
            peserta berformat{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold">
              /absen/[id]
            </code>{" "}
            dan tidak memerlukan akun.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 text-xs text-slate-500">
          PT PLN (Persero) UP3 Kediri
        </div>
      </footer>
    </div>
  );
}
