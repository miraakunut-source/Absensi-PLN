import Alert, { type AlertTone } from "@/components/ui/Alert";

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
    <>
      <Alert tone={tone} title={title}>
        {message}
      </Alert>
      {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
    </>
  );
}
