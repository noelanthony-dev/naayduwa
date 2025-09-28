"use client";
import { getAuth } from "firebase/auth";

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
        attendees: (data.attendees as EventItem["attendees"]) ?? [],
        id: d.id,
        updatedAt,
      } as EventItem);
    });
    cb(out);
  });
}

export async function addEvent(ev: EventItem) {
  const ref = doc(collection(db, EVENTS), ev.id);
  const uid = getAuth(app).currentUser?.uid;
  const payload = sanitize({
    ...ev,
    ...(uid ? { ownerUid: uid } : {}), // include only if available
    updatedAt: Timestamp.fromMillis(Date.now()),
  });
  await setDoc(ref, payload, { merge: true });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, EVENTS, eventId));
}

export async function addAttendee(eventId: string, attendee: Attendee) {
  const ref = doc(db, EVENTS, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as EventItem;
  const next = [...(data.attendees ?? []), attendee];
  await updateDoc(ref, sanitize({
    attendees: next,
    updatedAt: Timestamp.fromMillis(Date.now()),
  }));
}

export async function removeAttendee(eventId: string, attendeeId: string) {
  const ref = doc(db, EVENTS, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as EventItem;
  const next = (data.attendees ?? []).filter((a) => a.id !== attendeeId);
  await updateDoc(ref, sanitize({
    attendees: next,
    updatedAt: Timestamp.fromMillis(Date.now()),
  }));
}

function sanitize<T>(input: T): T {
  const prune = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(prune);
    if (v !== null && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        const cleaned = prune(val);
        if (cleaned !== undefined) out[k] = cleaned;
      }
      return out;
    }
    return v === undefined ? undefined : v;
  };
  return prune(input) as T;
}