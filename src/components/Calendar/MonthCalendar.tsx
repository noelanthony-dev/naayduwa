// High-level calendar grid (month view)

"use client";
import DayCell from "./DayCell";
import { useCalendar } from "@/store/useCalendarStore";

const monthLabel = (monthISO: string) => {
  const [y, m] = monthISO.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
};

function getGrid(monthISO: string): { dateISO: string; isCurrentMonth: boolean }[] {
  const [y, m] = monthISO.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  // Sunday-first (0 = Sun, 6 = Sat)
  const startWeekday = first.getUTCDay();
  const daysInCur = new Date(y, m, 0).getDate();

  // prev month spill
  const prevMonthDays: { dateISO: string; isCurrentMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1, -i));
    prevMonthDays.push({ dateISO: d.toISOString().slice(0, 10), isCurrentMonth: false });
  }

  // current month
  const cur: { dateISO: string; isCurrentMonth: boolean }[] = [];
  for (let i = 1; i <= daysInCur; i++) {
    const d = new Date(Date.UTC(y, m - 1, i));
    cur.push({ dateISO: d.toISOString().slice(0, 10), isCurrentMonth: true });
  }

  // next spill to complete the last week only
  const total = prevMonthDays.length + cur.length;
  const lastRowFill = (7 - (total % 7)) % 7;
  const next: { dateISO: string; isCurrentMonth: boolean }[] = [];
  for (let i = 1; i <= lastRowFill; i++) {
    const d = new Date(Date.UTC(y, m - 1, daysInCur + i));
    next.push({ dateISO: d.toISOString().slice(0, 10), isCurrentMonth: false });
  }

  return [...prevMonthDays, ...cur, ...next];
}

export default function MonthCalendar() {
  const { state, dispatch } = useCalendar();
  const grid = getGrid(state.monthCursorISO);

  return (
    <div className="w-full bg-black p-0 md:p-6 border-0 md:border md:border-white/8 md:shadow-soft">
      <div className="mb-3 flex items-center justify-center gap-4">
        <span className="hidden sm:inline">
          <button
            aria-label="Previous month"
            onClick={() => dispatch({ type: "NAV_MONTH", payload: -1 })}
            className="hidden sm:grid h-10 w-10 rounded-md bg-black border border-primary/50 text-primary hover:bg-primary/10 transition place-items-center"
          >
            ‹
          </button>
        </span>

        <h2 className="text-xl sm:text-3xl font-semibold tracking-wide text-fg leading-tight">
          {monthLabel(state.monthCursorISO)}
        </h2>

        <span className="hidden sm:inline">
          <button
            aria-label="Next month"
            onClick={() => dispatch({ type: "NAV_MONTH", payload: 1 })}
            className="hidden sm:grid h-10 w-10 rounded-md bg-black border border-primary/50 text-primary hover:bg-primary/10 transition place-items-center"
          >
            ›
          </button>
        </span>
      </div>

      <div className="overflow-hidden rounded-none md:border md:border-white/10">
        <div className="grid grid-cols-7 bg-[#1E1E2E]">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div
              key={d}
              className="px-2 py-1 text-center text-xs sm:text-sm font-semibold uppercase text-fg"
            >
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/10">
          {grid.map((cell) => (
            <div
              key={cell.dateISO}
              className={cell.isCurrentMonth ? "bg-black" : "bg-[#21212E]"}
            >
              <DayCell
                dateISO={cell.dateISO}
                isCurrentMonth={cell.isCurrentMonth}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}