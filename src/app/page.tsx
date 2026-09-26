import BarLink from "@/components/brand/BarLink";
import BrandBar from "@/components/brand/BrandBar";
import Card, { CardHeader } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandBar
        trailing={
          <>
            <BarLink href="/">Beranda</BarLink>
            <BarLink href="/admin/login">Login Admin</BarLink>
          </>
        }
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        <div className="border-b border-line pb-6">
          <h1 className="type-display">Absensi kegiatan UP3 Kediri</h1>
          <p className="type-body mt-3 max-w-xl text-muted">
            Form absensi resmi PLN UP3 Kediri. Peserta memindai QR Code kegiatan
            dan mengisi isian langsung di HP — tanpa akun, tanpa install
            aplikasi.
          </p>
        </div>

        <Card className="mt-6">
          <CardHeader
            title="Untuk peserta"
            description="Absensi dibuka lewat QR Code kegiatan yang dibagikan panitia."
          />
          <div className="px-5 py-5">
            <p className="type-body text-muted">
              Pindai QR Code, isi data, lalu tanda tangan di layar. Setelah
              terkirim, data langsung masuk ke rekap panitia. Tidak perlu login
              dan tidak perlu koneksi internet tambahan selain sinyal HP.
            </p>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader
            title="Untuk admin"
            description="Dashboard, editor form, dan rekap absensi."
          />
          <div className="px-5 py-5">
            <p className="type-body text-muted">
              Masuk dengan akun admin Firebase Auth untuk membuat kegiatan,
              mencetak QR Code, dan mengunduh rekap.
            </p>
          </div>
        </Card>
        <Card className="mt-6">
          <CardHeader
            title="Cara kerja peserta"
            description="Tiga langkah, tanpa akun dan tanpa aplikasi."
          />
          <ol className="grid gap-4 px-5 py-5 sm:grid-cols-3">
            {[
              {
                step: "Pindai",
                text: "Buka kamera HP dan arahkan ke QR Code kegiatan yang ditampilkan panitia.",
              },
              {
                step: "Isi",
                text: "Lengkapi data yang diminta halaman demi halaman, lalu bubuhkan tanda tangan.",
              },
              {
                step: "Kirim",
                text: "Klik kirim absensi. Data langsung tercatat di rekap panitia beserta tanda tangannya.",
              },
            ].map((item, index) => (
              <li key={item.step} className="border-l-2 border-gold-500 pl-4">
                <p className="type-caption">
                  Langkah {index + 1}
                </p>
                <p className="type-heading mt-1">{item.step}</p>
                <p className="type-body mt-1 text-muted">{item.text}</p>
              </li>
            ))}
          </ol>
        </Card>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-3xl px-4 py-5">
          <p className="type-caption">
            PT PLN (Persero) UP3 Kediri — sistem absensi digital.
          </p>
        </div>
      </footer>
    </div>
  );
}
