//# localStorage adapter (can swap to Firebase later)

const KEY = "naayduwa:calendar";

export function save<T>(data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function load<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as T) : fallback;
}