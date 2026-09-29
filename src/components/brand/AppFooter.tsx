interface AppFooterProps {
  className?: string;
}

export default function AppFooter({ className }: AppFooterProps) {
  return (
    <footer
      className={`border-t border-brand-700 bg-brand-800 print:hidden ${
        className ?? ""
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <p className="text-sm text-white/75">
          PT PLN (Persero) UP3 Kediri — sistem presensi digital.
        </p>
      </div>
    </footer>
  );
}
