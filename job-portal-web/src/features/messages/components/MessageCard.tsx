import Button from "../../../shared/components/Button";
import type { MessageStatus } from "../types";

type Props = { name: string; subject: string; status: MessageStatus; date: string; creditCost: number; onView?: () => void; onDelete?: () => void; onRetry?: () => void };
const tones: Record<MessageStatus, string> = { waiting: "#3B82F6", sent: "#3B82F6", seen: "#F59E0B", accepted: "#10B981", rejected: "#EF4444", expired: "#6B7280", invalid: "#EF4444" };

export default function MessageCard({ name, subject, status, date, creditCost, onView, onDelete, onRetry }: Props) {
  return (
    <article className="rounded-lg border border-border-gray bg-bg-white p-4">
      <div className="grid gap-3">
        <div>
          <h3 className="m-0 text-base font-bold text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-secondary-gray">{subject}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ background: tones[status] }} className="inline-flex rounded-md px-1 py-1 text-xs font-bold text-white">{status}</span>
          <span className="text-xs text-secondary-gray">{date}</span>
          <span className="text-xs text-secondary-gray">{creditCost ? `-${creditCost} credit${creditCost > 1 ? "s" : ""}` : "0 credits"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onView} ariaLabel={`View message from ${name}`}>View</Button>
          <Button variant="secondary" size="sm" onClick={onDelete} ariaLabel="Delete message">Delete</Button>
          <Button variant="secondary" size="sm" onClick={onRetry} ariaLabel="Retry sending message">Retry</Button>
        </div>
      </div>
    </article>
  );
}
