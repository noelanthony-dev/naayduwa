//# Central state (events, selectedDate, open modals)

"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { subscribeEvents, addEvent as fsAddEvent, deleteEvent as fsDeleteEvent, addAttendee as fsAddAttendee, removeAttendee as fsRemoveAttendee } from "@/lib/firestore";
import { CalendarState, EventItem, Attendee } from "@/types/event";
import { load, save } from "@/lib/storage";
import { startOfMonthISO, toISODate } from "@/lib/date";

// Helper: extract message without using `any`
function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Allow non-React callers (e.g., reducer side-effects) to surface toasts
let globalDispatch: React.Dispatch<Action> | null = null;
function toast(msg: string) {
  if (globalDispatch) {
    globalDispatch({ type: "SHOW_TOAST", payload: msg });
    // auto-clear after 3s
    setTimeout(() => globalDispatch && globalDispatch({ type: "CLEAR_TOAST" }), 3000);
  }
}

type ExtState = CalendarState & { toastMessage: string | null };
type Action =
  | { type: "INIT_EVENTS"; payload: EventItem[] }
  | { type: "NAV_MONTH"; payload: number } // +1 / -1
  | { type: "SET_SELECTED_DATE"; payload?: string }
  | { type: "OPEN_ADD_EVENT"; payload: string } // dateISO
  | { type: "CLOSE_ADD_EVENT" }
  | { type: "ADD_EVENT"; payload: EventItem }
  | { type: "OPEN_DETAILS"; payload: string }          // eventId
  | { type: "CLOSE_DETAILS" }
  | { type: "ADD_ATTENDEE"; payload: { eventId: string; attendee: Attendee } }
  | { type: "REMOVE_ATTENDEE"; payload: { eventId: string; attendeeId: string } }
  | { type: "DELETE_EVENT"; payload: { eventId: string } }
  | { type: "UPDATE_EVENT"; payload: { event: EventItem } }
  | { type: "SHOW_TOAST"; payload: string }
  | { type: "CLEAR_TOAST" };

const todayISO = toISODate(new Date());

const initialState: ExtState = load<ExtState>({
  monthCursorISO: startOfMonthISO(new Date()),
  selectedDateISO: todayISO,
  events: [],
  modal: { addEventOpen: false },
  toastMessage: null,
});

function reducer(state: ExtState, action: Action): ExtState {
  switch (action.type) {
    case "INIT_EVENTS": {
      const next = { ...state, events: action.payload };
      save(next);
      return next;
    }
    case "NAV_MONTH": {
      const d = new Date(state.monthCursorISO + "T00:00:00Z");
      d.setUTCMonth(d.getUTCMonth() + action.payload);
      const monthCursorISO = startOfMonthISO(d);
      const next = { ...state, monthCursorISO };
      save(next);
      return next;
    }
    case "SET_SELECTED_DATE": {
      const next = { ...state, selectedDateISO: action.payload };
      save(next);
      return next;
    }
    case "OPEN_ADD_EVENT": {
      const next = { ...state, modal: { ...state.modal, addEventOpen: true }, selectedDateISO: action.payload };
      save(next);
      return next;
    }
    case "CLOSE_ADD_EVENT": {
      const next = { ...state, modal: { ...state.modal, addEventOpen: false } };
      save(next);
      return next;
    }
    case "ADD_EVENT": {
      // Write to Firestore; list will refresh via snapshot
      void fsAddEvent(action.payload).catch((e) => {
        console.error("Add event failed:", e);
        toast(`Add failed: ${errMsg(e)}`);
      });
      const next = { ...state, modal: { ...state.modal, addEventOpen: false } };
      save(next);
      return next;
    }
    case "OPEN_DETAILS": {
      const next = { ...state, modal: { ...state.modal, detailsEventId: action.payload } };
      save(next);
      return next;
    }
    case "CLOSE_DETAILS": {
      const next = { ...state, modal: { ...state.modal, detailsEventId: undefined } };
      save(next);
      return next;
    }
    case "ADD_ATTENDEE": {
      void fsAddAttendee(action.payload.eventId, action.payload.attendee).catch((e) => {
        console.error("Add attendee failed:", e);
        toast(`Add attendee failed: ${errMsg(e)}`);
      });
      return state;
    }
    case "REMOVE_ATTENDEE": {
      void fsRemoveAttendee(action.payload.eventId, action.payload.attendeeId).catch((e) => {
        console.error("Remove attendee failed:", e);
        toast(`Remove attendee failed: ${errMsg(e)}`);
      });
      return state;
    }
    case "DELETE_EVENT": {
      void fsDeleteEvent(action.payload.eventId).catch((e) => {
        console.error("Delete event failed:", e);
        toast(`Delete failed: ${errMsg(e)}`);
      });
      const next = { ...state, modal: { ...state.modal, detailsEventId: undefined } };
      save(next);
      return next;
    }
    case "UPDATE_EVENT": {
      // Upsert to Firestore (re-uses add API which setDocs by id)
      void fsAddEvent(action.payload.event).catch((e) => {
        console.error("Update event failed:", e);
        toast(`Update failed: ${errMsg(e)}`);
      });
      // Optimistic local update so UI reflects immediately
      const events = state.events.map((e) =>
        e.id === action.payload.event.id ? action.payload.event : e
      );
      const next = { ...state, events };
      save(next);
      return next;
    }
    case "SHOW_TOAST": {
      const next = { ...state, toastMessage: action.payload };
      save(next);
      return next;
    }
    case "CLEAR_TOAST": {
      const next = { ...state, toastMessage: null };
      save(next);
      return next;
    }
    default:
      return state;
  }
}

const Ctx = createContext<{ state: ExtState; dispatch: React.Dispatch<Action> } | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  globalDispatch = dispatch;
  React.useEffect(() => {
    const unsub = subscribeEvents((events) => {
      dispatch({ type: "INIT_EVENTS", payload: events });
    });
    return () => unsub();
  }, []);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return React.createElement(Ctx.Provider, { value }, children);
}

export function useCalendar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}