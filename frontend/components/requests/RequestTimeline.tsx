import type { RequestStatus } from "@/types";

export type TimelineEvent = { status: RequestStatus; note: string | null; created_at: string };

export function RequestTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative border-l border-border pl-6">
      {events.map((e, i) => (
        <li key={i} className="mb-6 ml-1">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-accent" />
          <p className="text-sm font-medium text-primary">{e.status.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
          {e.note && <p className="mt-1 text-sm text-muted-foreground">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
