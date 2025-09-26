

"use client";

import { useCalendar } from "@/store/useCalendarStore";

export default function Toast() {
  const { state, dispatch } = useCalendar();
  const msg = state.toastMessage;

  if (!msg) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200]"
    >
      <button
        onClick={() => dispatch({ type: "CLEAR_TOAST" })}
        className="rounded-lg bg-green-600/90 text-white px-4 py-2 text-sm shadow-lg border border-green-500/40 hover:bg-green-600"
      >
        {msg}
      </button>
    </div>
  );
}