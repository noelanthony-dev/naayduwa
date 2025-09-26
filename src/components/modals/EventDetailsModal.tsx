"use client";

import Modal from "@/components/ui/Modal";
import { useCalendar } from "@/store/useCalendarStore";
import { useEffect, useMemo, useState } from "react";
import { AttendeeStatus, EventItem } from "@/types/event";

function formatHeading(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

function to12h(t24: string | undefined): string {
  if (!t24) return "";
  const [H, M] = t24.split(":").map(Number);
  const h = ((H + 11) % 12) + 1;
  const ampm = H >= 12 ? "PM" : "AM";
  return `${h}:${String(M).padStart(2, "0")} ${ampm}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Inline edit helpers
const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "30"] as const;
const AMPM = ["AM", "PM"] as const;
type AmPm = (typeof AMPM)[number];

function split24(time?: string): { h12: string; m: typeof MINUTES[number]; ampm: AmPm } {
  if (!time) return { h12: "06", m: "00", ampm: "PM" };
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const ampm: AmPm = h >= 12 ? "PM" : "AM";
  const h12Num = ((h + 11) % 12) + 1;
  const h12 = String(h12Num).padStart(2, "0");
  const m = (MINUTES as readonly string[]).includes(mStr) ? (mStr as typeof MINUTES[number]) : "00";
  return { h12, m, ampm };
}
function join24(h12: string, m: string, ampm: AmPm): string {
  let h = Number(h12);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}
function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function EventDetailsModal() {
  const { state, dispatch } = useCalendar();
  const open = Boolean(state.modal.detailsEventId);

  const event: EventItem | undefined = useMemo(
    () => state.events.find((e) => e.id === state.modal.detailsEventId),
    [state.events, state.modal.detailsEventId]
  );

  const [showAdd, setShowAdd] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerStatus, setPlayerStatus] = useState<AttendeeStatus>("confirmed");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [editCourt, setEditCourt] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [sHour, setSHour] = useState<string>("06");
  const [sMin, setSMin] = useState<typeof MINUTES[number]>("00");
  const [sAm, setSAm] = useState<AmPm>("PM");
  const [eHour, setEHour] = useState<string>("07");
  const [eMin, setEMin] = useState<typeof MINUTES[number]>("00");
  const [eAm, setEAm] = useState<AmPm>("PM");

  useEffect(() => {
    // Reset editing fields when modal opens or event changes
    setEditing(false);
    if (!event) return;
    setEditCourt(event.court ?? "");
    setEditNotes(event.notes ?? "");
    const sp = split24(event.startTime);
    setSHour(sp.h12); setSMin(sp.m); setSAm(sp.ampm);
    const ep = split24(event.endTime);
    setEHour(ep.h12); setEMin(ep.m); setEAm(ep.ampm);
  }, [event?.id, open]);

  if (!open || !event) return null;

  const attendeeCount = event.attendees.length;

  const addPlayer = () => {
    const name = playerName.trim();
    if (!name) return;
    dispatch({
      type: "ADD_ATTENDEE",
      payload: {
        eventId: event.id,
        attendee: { id: crypto.randomUUID(), name, status: playerStatus },
      },
    });
    setPlayerName("");
    setPlayerStatus("confirmed");
    setShowAdd(false);
  };

  const removePlayer = (id: string) =>
    dispatch({ type: "REMOVE_ATTENDEE", payload: { eventId: event.id, attendeeId: id } });

  const start24 = join24(sHour, sMin, sAm);
  const end24 = join24(eHour, eMin, eAm);
  const invalidEnd = end24 && toMinutes(end24) <= toMinutes(start24);

  return (
    <>
      <Modal open={open} onClose={() => dispatch({ type: "CLOSE_DETAILS" })}>
        <div className="w-full max-w-[100vw] h-[100dvh] overflow-x-hidden rounded-none bg-[#1E1E2E] md:w-[720px] md:max-w-[720px] md:h-auto md:max-h-[80vh] md:rounded-2xl md:overflow-hidden">
          <div className="flex h-full flex-col">
            {/* Header (sticky on mobile) */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1E1E2E] px-4 py-3 md:px-6 md:py-4">
              <div className="text-base sm:text-lg font-semibold text-fg">{formatHeading(event.dateISO)}</div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <button
                    aria-label="Save changes"
                    title="Save changes"
                    onClick={() => {
                      if (invalidEnd) return;
                      const updated: EventItem = {
                        ...event,
                        court: editCourt.trim(),
                        notes: editNotes.trim() || undefined,
                        startTime: start24,
                        ...(event.endTime === undefined && !end24 ? {} : (end24 ? { endTime: end24 } : { endTime: undefined })),
                        updatedAt: Date.now(),
                      };
                      dispatch({ type: "UPDATE_EVENT", payload: { event: updated } });
                      setEditing(false);
                      dispatch({ type: "SHOW_TOAST", payload: "Event updated" });
                      setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 2000);
                    }}
                    className="h-8 px-3 grid place-items-center rounded-md bg-primary/20 text-primary hover:bg-primary/30 text-sm disabled:opacity-50"
                    disabled={Boolean(invalidEnd)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    aria-label="Edit event"
                    title="Edit event"
                    onClick={() => setEditing(true)}
                    className="h-8 w-8 grid place-items-center rounded-md bg-[#1E1E2E] border border-white/10 text-fg/80 hover:bg-white/10"
                  >
                    {/* Pencil icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm3.92 2.33H5v-1.92L14.06 7.52l1.92 1.92L6.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                )}
                <button
                  aria-label="Delete event"
                  title="Delete event"
                  onClick={() => setConfirmOpen(true)}
                  className="h-8 w-8 grid place-items-center rounded-md bg-[#1E1E2E] border border-white/10 text-fg/80 hover:bg-white/10"
                >
                  {/* Trash icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h4V4h-4v1zM8 7h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7zm3 3a1 1 0 1 0-2 0v7a1 1 0 1 0 2 0v-7zm5 0a1 1 0 1 0-2 0v7a1 1 0 1 0 2 0v-7z"/>
                  </svg>
                </button>
                <button
                  aria-label="Close"
                  onClick={() => dispatch({ type: "CLOSE_DETAILS" })}
                  className="h-8 w-8 grid place-items-center rounded-md bg-[#1E1E2E] border border-white/10 text-fg/80 hover:bg-white/10"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
              <div className="rounded-xl bg-black border border-white/10 p-4 md:p-6">
                {/* Title (Court) + Notes */}
                <div className="mb-3 space-y-1">
                  {editing ? (
                    <input className="input" value={editCourt} onChange={(e) => setEditCourt(e.target.value)} placeholder="Court" />
                  ) : (
                    <div className="text-lg sm:text-xl font-semibold text-fg">{event.court ?? "Event"}</div>
                  )}
                  {editing ? (
                    <input className="input" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes" />
                  ) : (
                    event.notes ? <div className="text-sm text-fg/70">{event.notes}</div> : null
                  )}
                </div>

                {/* Time */}
                {!editing && (event.startTime || event.endTime) && (
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-xl border-2 border-primary/60 bg-black px-3 py-1.5 text-primary font-semibold text-base leading-none">
                      {to12h(event.startTime)}
                      {event.endTime ? ` – ${to12h(event.endTime)}` : ""}
                    </div>
                  </div>
                )}
                {editing && (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="label">Start</div>
                      <div className="grid grid-cols-3 gap-2">
                        <select className="input" value={sHour} onChange={(e) => setSHour(e.target.value)}>
                          {HOURS_12.map((h) => (<option key={h} value={h}>{h}</option>))}
                        </select>
                        <select className="input" value={sMin} onChange={(e) => setSMin(e.target.value as typeof MINUTES[number])}>
                          {MINUTES.map((m) => (<option key={m} value={m}>{m}</option>))}
                        </select>
                        <select className="input" value={sAm} onChange={(e) => setSAm(e.target.value as AmPm)}>
                          {AMPM.map((p) => (<option key={p} value={p}>{p}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="label">End (optional)</div>
                      <div className="grid grid-cols-3 gap-2">
                        <select className="input" value={eHour} onChange={(e) => setEHour(e.target.value)}>
                          {HOURS_12.map((h) => (<option key={h} value={h}>{h}</option>))}
                        </select>
                        <select className="input" value={eMin} onChange={(e) => setEMin(e.target.value as typeof MINUTES[number])}>
                          {MINUTES.map((m) => {
                            const t = join24(eHour, m, eAm);
                            const disabled = toMinutes(t) <= toMinutes(start24);
                            return <option key={m} value={m} disabled={disabled}>{m}</option>;
                          })}
                        </select>
                        <select className="input" value={eAm} onChange={(e) => setEAm(e.target.value as AmPm)}>
                          {AMPM.map((p) => (<option key={p} value={p}>{p}</option>))}
                        </select>
                      </div>
                      {end24 && toMinutes(end24) <= toMinutes(start24) && (
                        <div className="mt-1 text-xs text-red-400">End time must be after start time.</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="my-4 h-px bg-white/10" />

                {/* Attending summary + actions */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-lime-400/20 text-lime-300 px-2 py-0.5 text-xs">{attendeeCount} attending</span>
                    <span className="hidden sm:inline text-xs text-fg/60">Updated 1h ago</span>
                  </div>
                  <button
                    className="rounded-lg bg-[#1E1E2E] px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                    onClick={() => setShowAdd((s) => !s)}
                  >
                    {showAdd ? "Close" : "+ Add Player"}
                  </button>
                </div>

                {/* Attendees list */}
                <div className="text-sm font-medium text-fg mb-2">Kinsay muduwa? ({attendeeCount})</div>
                <div className="space-y-2">
                  {attendeeCount === 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-fg/70">Walay mo duwa 😢</div>
                  )}
                  {event.attendees.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary font-semibold">
                          {initials(a.name)}
                        </div>
                        <div className="leading-tight">
                          <div className="font-medium text-fg">{a.name}</div>
                          <div className="text-xs text-fg/70">{(a.status ?? "confirmed") === "confirmed" ? "Confirmed" : (a.status ?? "maybe") === "maybe" ? "Maybe" : "No"}</div>
                        </div>
                      </div>
                      <button onClick={() => removePlayer(a.id)} className="h-7 w-7 grid place-items-center rounded-md bg-white/5 border border-white/10 text-fg/70 hover:text-fg">×</button>
                    </div>
                  ))}
                </div>

                {/* Add Player form */}
                {showAdd && (
                  <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        className="input md:col-span-2"
                        placeholder="Player name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                      <select
                        className="input"
                        value={playerStatus}
                        onChange={(e) => setPlayerStatus(e.target.value as AttendeeStatus)}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="maybe">Maybe</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button className="btn-ghost" onClick={() => { setPlayerName(""); setPlayerStatus("confirmed"); setShowAdd(false); }}>Cancel</button>
                      <button className="btn-primary" onClick={addPlayer}>Add Player</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="w-full max-w-[92vw] md:max-w-[420px] bg-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-base font-semibold text-fg">Delete event?</div>
            <button
              aria-label="Close"
              onClick={() => setConfirmOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-md bg-[#1E1E2E] border border-white/10 text-fg/80 hover:bg-white/10"
            >
              ×
            </button>
          </div>
          <div className="p-4 md:p-5">
            <div className="rounded-xl bg-black border border-white/10 p-4">
              <p className="text-sm text-fg/80">
                This will permanently remove <span className="font-semibold">{event.court ?? "Event"}</span> on {formatHeading(event.dateISO)}.
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button
                className="rounded-lg px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  dispatch({ type: "DELETE_EVENT", payload: { eventId: event.id } });
                  setConfirmOpen(false);
                  dispatch({ type: "CLOSE_DETAILS" });
                  dispatch({ type: "SHOW_TOAST", payload: "Event deleted" });
                  setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 3000);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}