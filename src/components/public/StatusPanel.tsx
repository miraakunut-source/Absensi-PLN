import Alert, { type AlertTone } from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

interface StatusPanelProps {
  tone?: AlertTone;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export default function StatusPanel({
  tone = "warn",
  title,
  message,
  action,
}: StatusPanelProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <Alert tone={tone} title={title}>
        {message}
      </Alert>
      {action ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}

interface StatusActionProps {
  href: string;
  children: React.ReactNode;
}

export function StatusAction({ href, children }: StatusActionProps) {
  return (
    <Button href={href} variant="secondary" size="md">
      {children}
    </Button>
  );
}
