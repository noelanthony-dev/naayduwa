"use client";

import { app } from "./firebase";
import {
  getFirestore, collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, getDoc, Timestamp
} from "firebase/firestore";
import type { Attendee, EventItem } from "@/types/event";

const db = getFirestore(app);
const EVENTS = "events";

export function subscribeEvents(
  cb: (events: EventItem[]) => void
) {
  const q = query(
    collection(db, EVENTS),
    orderBy("dateISO"),
    orderBy("startTime")
  );
  return onSnapshot(q, (snap) => {
    const out: EventItem[] = [];
    snap.forEach((d) => {
      const data = d.data() as Partial<EventItem> & { updatedAt?: Timestamp | number };
      const upd = data.updatedAt as unknown;
      let updatedAt: number;
      if (typeof upd === "number") {
        updatedAt = upd;
      } else if (upd && typeof (upd as Timestamp).toMillis === "function") {
        updatedAt = (upd as Timestamp).toMillis();
      } else {
        updatedAt = Date.now();
      }

      out.push({
        ...data,
        id: d.id,
        updatedAt,
      } as EventItem);
    });
    cb(out);
  });
}

export async function addEvent(ev: EventItem) {
  const ref = doc(collection(db, EVENTS), ev.id);
  await setDoc(ref, {
    ...ev,
    updatedAt: Timestamp.fromMillis(Date.now()),
  });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, EVENTS, eventId));
}

export async function addAttendee(eventId: string, attendee: Attendee) {
  // Use atomic approach: read, modify, write (safer than arrayUnion for partial equality)
  const ref = doc(db, EVENTS, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as EventItem;
  const next = [...(data.attendees ?? []), attendee];
  await updateDoc(ref, {
    attendees: next,
    updatedAt: Timestamp.fromMillis(Date.now()),
  });
}

export async function removeAttendee(eventId: string, attendeeId: string) {
  const ref = doc(db, EVENTS, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as EventItem;
  const next = (data.attendees ?? []).filter((a) => a.id !== attendeeId);
  await updateDoc(ref, {
    attendees: next,
    updatedAt: Timestamp.fromMillis(Date.now()),
  });
}