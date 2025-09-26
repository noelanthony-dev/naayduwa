//# date-fns wrappers (format, startOfMonth, etc.)

export function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  
  export function startOfMonthISO(d: Date): string {
    const d2 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    return toISODate(d2);
  }
  
  export function daysInMonth(year: number, month0: number): number {
    return new Date(year, month0 + 1, 0).getDate();
  }