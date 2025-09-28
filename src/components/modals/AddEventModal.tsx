//Create event (date, start/end, court, notes)
"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useCalendar } from "@/store/useCalendarStore";
import { EventItem } from "@/types/event";

export default function AddEventModal() {
  const { state, dispatch } = useCalendar();
  const open = state.modal.addEventOpen;
  const todayISO = new Date().toISOString().slice(0, 10);
  const initialDateISO =
    state.selectedDateISO && state.selectedDateISO >= todayISO
      ? state.selectedDateISO
      : todayISO;
  const [dateISO, setDateISO] = useState(initialDateISO);

  // helpers for time comparison and math (HH:mm)
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fmt = (mins: number) => {
    const H = Math.floor((mins % (24 * 60)) / 60);
    const M = mins % 60;
    return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
  };
  const addMinutes = (t: string, n: number) => fmt(toMinutes(t) + n);

  // Sync the date field whenever the selected DayCell changes or when the modal opens
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const selected = state.selectedDateISO ?? today;
    setDateISO(selected < today ? today : selected);
  }, [state.selectedDateISO, open]);

  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("");
  const [court, setCourt] = useState("");
  const [notes, setNotes] = useState("");
  const [courtError, setCourtError] = useState<string | null>(null);

  const isEndInvalid = Boolean(endTime) && toMinutes(endTime) <= toMinutes(startTime);
  const isCourtInvalid = court.trim().length === 0;

  const onSave = () => {
    if (dateISO < todayISO) return;
    if (endTime && toMinutes(endTime) <= toMinutes(startTime)) return; // invalid, do not save
  
    const trimmedCourt = court.trim();
    if (!trimmedCourt) {
      setCourtError("Court is required");
      return; // require court
    }
    const trimmedNotes = notes.trim();
  
    const ev: EventItem = {
      id: crypto.randomUUID(),
      dateISO,
      startTime,
      ...(endTime ? { endTime } : {}),           // include only if provided
      court: trimmedCourt,                       // always trimmed
      ...(trimmedNotes ? { notes: trimmedNotes } : {}), // omit if empty
      attendees: [],
      updatedAt: Date.now(),
    };
  
    dispatch({ type: "ADD_EVENT", payload: ev });
  };

  return (
    <Modal open={open} onClose={() => dispatch({ type: "CLOSE_ADD_EVENT" })}>
      <div className="w-full max-w-[100vw] h-[100dvh] overflow-x-hidden rounded-none bg-[#1E1E2E] md:w-[720px] md:max-w-[720px] md:h-auto md:max-h-[80vh] md:rounded-2xl md:overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header (sticky on mobile) */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1E1E2E] px-4 py-3 md:px-6 md:py-4">
            <div className="text-base sm:text-lg font-semibold text-fg">Add Event</div>
            <button
              aria-label="Close"
              onClick={() => dispatch({ type: "CLOSE_ADD_EVENT" })}
              className="h-8 w-8 grid place-items-center rounded-md bg-[#1E1E2E] border border-white/10 text-fg/80 hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            <div className="rounded-xl bg-black border border-white/10 p-4 md:p-6">
              <div className="grid gap-4">
                <div>
                  <div className="label">Date</div>
                  <input
                    className="input"
                    type="date"
                    value={dateISO}
                    min={todayISO}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDateISO(next < todayISO ? todayISO : next);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="label">Start</div>
                    {/* step=1800 ensures only 00 and 30 minute intervals in mobile spinners */}
                    <input
                      className="input"
                      type="time"
                      step="1800"
                      min="00:00"
                      max="23:30"
                      value={startTime}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        setStartTime(nextStart);
                        if (endTime && toMinutes(endTime) <= toMinutes(nextStart)) {
                          setEndTime(addMinutes(nextStart, 30));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="label">End (optional)</div>
                    {/* step=1800 ensures only 00 and 30 minute intervals in mobile spinners */}
                    <input
                      className="input"
                      type="time"
                      step="1800"
                      min={addMinutes(startTime, 30)}
                      max="23:30"
                      value={endTime}
                      onChange={(e) => {
                        const nextEnd = e.target.value;
                        // If user picks something not after start, bump to start+30
                        if (nextEnd && toMinutes(nextEnd) <= toMinutes(startTime)) {
                          setEndTime(addMinutes(startTime, 30));
                        } else {
                          setEndTime(nextEnd);
                        }
                      }}
                    />
                    {endTime && toMinutes(endTime) <= toMinutes(startTime) && (
                      <div className="mt-1 text-xs text-red-400">End time must be after start time.</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="label">Court</div>
                  <input
                    className="input"
                    value={court}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCourt(v);
                      if (courtError && v.trim().length > 0) setCourtError(null);
                    }}
                    placeholder="Magnum"
                    required
                    aria-invalid={Boolean(courtError)}
                    aria-describedby={courtError ? "court-error" : undefined}
                  />
                  {courtError && (
                    <div id="court-error" className="mt-1 text-xs text-red-400">Court is required.</div>
                  )}
                </div>

                <div>
                  <div className="label">Notes</div>
                  <input
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="court number, fee, etc."
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => dispatch({ type: "CLOSE_ADD_EVENT" })}>
                  Cancel
                </button>
                <button
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onSave}
                  disabled={isEndInvalid || isCourtInvalid}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}