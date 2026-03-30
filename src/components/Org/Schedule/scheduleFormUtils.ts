/** Weekday values used in Selects (must match API / POST payload). */
export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** 24h clock, 30-minute steps (00:00 … 23:30). */
export const TIME_OPTIONS_24H: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

export function normalizeDayForSelect(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const found = WEEK_DAYS.find((w) => w.toLowerCase() === lower);
  return found ?? "";
}

/** Strip to HH:mm and snap to nearest TIME_OPTIONS_24H slot. */
export function normalizeTimeForSelect(raw: unknown): string {
  if (raw == null) return "";
  const str = String(raw).trim();
  if (!str) return "";
  // Accept:
  // - "09:30"
  // - "09:30:00"
  // - ISO strings like "2026-03-30T09:30:00Z"
  // - "09:30 AM"/"09:30 PM"
  const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return "";
  let h = parseInt(match[1], 10);
  let min = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return "";

  const ampm = match[4] ? String(match[4]).toUpperCase() : "";
  if (ampm === "AM" || ampm === "PM") {
    if (h === 12) h = ampm === "AM" ? 0 : 12;
    else h = ampm === "PM" ? h + 12 : h;
  }

  h = Math.max(0, Math.min(23, h));
  min = Math.max(0, Math.min(59, min));
  const total = Math.min(24 * 60 - 1, h * 60 + min);
  const slotMinutes = 30;
  const rounded = Math.round(total / slotMinutes) * slotMinutes;
  const clamped = Math.min(23 * 60 + 30, rounded);
  const rh = Math.floor(clamped / 60);
  const rm = clamped % 60;
  const candidate = `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
  return TIME_OPTIONS_24H.includes(candidate) ? candidate : "23:30";
}

export function mapApiDayRow(row: any): {
  day: string;
  startTime: string;
  endTime: string;
} {
  const dayRaw =
    row?.day ??
    row?.weekDay ??
    row?.weekday ??
    row?.dayOfWeek ??
    row?.day_of_week ??
    "";
  const startRaw = row?.startTime ?? row?.start_time ?? "";
  const endRaw = row?.endTime ?? row?.end_time ?? "";
  return {
    day: normalizeDayForSelect(dayRaw),
    startTime: normalizeTimeForSelect(startRaw),
    endTime: normalizeTimeForSelect(endRaw),
  };
}

export function mapScheduleAvailableDays(schedule: {
  availableDays?: any[] | null;
  days?: any[] | null;
  slots?: any[] | null;
}): { day: string; startTime: string; endTime: string }[] {
  const rows = Array.isArray(schedule?.availableDays)
    ? schedule.availableDays
    : Array.isArray(schedule?.days)
      ? schedule.days
      : Array.isArray(schedule?.slots)
        ? schedule.slots
        : [];
  return rows.map((r) => mapApiDayRow(r));
}
