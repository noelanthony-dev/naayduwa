// Event, Attendee, Court types (strict, no `any`)
export type CourtId = string;
export type AttendeeStatus = "confirmed" | "maybe";

export interface Attendee {
  id: string;          // e.g., slug or uuid
  name: string;
  status?: AttendeeStatus;
}

export interface EventItem {
  id: string;
  dateISO: string;     // e.g., "2025-09-25"
  startTime: string;   // "HH:mm" (12h UI, stored 24h)
  endTime?: string;    // optional; if missing, show start only
  court: CourtId;
  notes?: string;
  attendees: Attendee[];
  updatedAt: number;   // epoch ms
}

export interface ModalState {
  addEventOpen: boolean;
  detailsEventId?: string;
  manageAttendeesEventId?: string;
}

export interface CalendarState {
  monthCursorISO: string; // first day of visible month, "YYYY-MM-01"
  selectedDateISO?: string;
  events: EventItem[];
  modal: ModalState;
}