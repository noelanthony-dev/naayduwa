// Inline chip: start time + court (mobile-friendly, no extra padding)
"use client";

import { EventItem } from "@/types/event";
import { useCalendar } from "@/store/useCalendarStore";

function to12h(t24?: string): string {
  if (!t24) return "";
  const [H, M] = t24.split(":").map(Number);
  if (Number.isNaN(H) || Number.isNaN(M)) return "";
  const h = ((H + 11) % 12) + 1;
  const ampm = H >= 12 ? "PM" : "AM";
  return `${h}:${String(M).padStart(2, "0")} ${ampm}`;
}

export default function EventChip({ ev }: { ev?: Partial<EventItem> }) {
  const { dispatch } = useCalendar();
  if (!ev) return null;

  const start = to12h(ev.startTime);
  const court = ev.court ?? "Event";

  // If absolutely nothing meaningful to show, skip rendering
  if (!start && !court) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        if (ev.id) dispatch({ type: "OPEN_DETAILS", payload: ev.id });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).click();
        }
      }}
      className="w-full text-left cursor-pointer flex flex-col rounded bg-white/10 p-1 hover:bg-white/20"
      title={court}
    >
      <div className="min-w-0">
        {start && (
          <div className="text-[10px] font-semibold text-primary">{start}</div>
        )}
        {court && (
          <div className="truncate text-[10px] text-fg/80">{court}</div>
        )}
      </div>
    </div>
  );
}