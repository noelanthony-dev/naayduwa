"use client";

import { useCalendar } from "@/store/useCalendarStore";
import EventChip from "./EventChip";

interface DayCellProps {
  dateISO: string;
  isCurrentMonth: boolean;
}

export default function DayCell({ dateISO, isCurrentMonth }: DayCellProps) {
  const { state, dispatch } = useCalendar();

  const todayISO = new Date().toISOString().slice(0, 10);
  const isToday = dateISO === todayISO;
  const isSelected = state.selectedDateISO === dateISO;
  const isPast = dateISO < todayISO;

  const events = (state.events || []).filter((ev) => ev && ev.dateISO === dateISO);

  return (
    <button
      onClick={() => {
        if (isPast) return;
        dispatch({ type: "SET_SELECTED_DATE", payload: dateISO });
        dispatch({ type: "OPEN_ADD_EVENT", payload: dateISO });
      }}
      className={[
        "relative w-full rounded-xl p-1.5 text-left transition",
        "h-24 sm:h-28 md:h-32",
        "bg-white/[0.02] hover:bg-white/[0.1] hover:scale-[1.02] transition-transform",
        isCurrentMonth ? "" : "opacity-50",
        isSelected ? "ring-2 ring-primary" : "",
        isToday ? "ring-1 ring-accent" : "",
        isPast ? "cursor-not-allowed" : "",
      ].join(" ")}
      title={isPast ? "Past date" : "Click to add event"}
    >
      {/* Date number */}
      <div className="pointer-events-none absolute right-2 top-2 text-sm md:text-base font-semibold text-white">
        {dateISO.slice(-2)}
      </div>

      {/* Events */}
      <div className="mt-4 flex flex-col gap-1">
        {events.map((ev) => (
          <EventChip key={ev.id} ev={ev} />
        ))}
      </div>
    </button>
  );
}