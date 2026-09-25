import BrandBar from "@/components/brand/BrandBar";
import Button from "@/components/ui/Button";
import Card, { CardHeader } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandBar width="wide" />

      <div className="border-b border-line bg-brand-800">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
          <h1 className="type-display text-white">
            Absensi kegiatan UP3 Kediri
          </h1>
          <p className="type-body mt-4 max-w-xl text-white/80">
            Form absensi resmi PLN UP3 Kediri. Peserta memindai QR Code kegiatan
            dan mengisi isian langsung di HP — tanpa akun, tanpa install
            aplikasi.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        <Card>
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
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/admin/login" size="lg">
                Masuk ke dashboard admin
              </Button>
              <Button href="/admin/dashboard" variant="secondary" size="lg">
                Buka dashboard
              </Button>
            </div>
          </div>
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
