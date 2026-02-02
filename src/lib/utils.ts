import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateFn = (date: string | Date = new Date()) => {
  return formatDate(new Date(date), "MMMM dd, yyyy");
};

/**
 * Formats a date to YYYY-MM-DD string in local timezone (not UTC)
 * This prevents timezone issues where dates shift by one day
 */
export function formatDateLocal(date: Date | string | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    date = parseISO(date);
  }
  // Format to 'YYYY-MM-DD' to avoid timezone issues when sending to backend
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO string (YYYY-MM-DD) to a local Date object, avoiding timezone shifts
 * This ensures that dates like "2026-01-03" are displayed as Jan 3, not Jan 2
 */
export function parseISOStringToLocalDate(isoString: string): Date {
  // If the string is in YYYY-MM-DD format, parse it directly to avoid timezone issues
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [year, month, day] = isoString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // For full ISO strings, parse and convert to local
  const date = parseISO(isoString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getChangedFields(original: any, updated: any) {
  const result: any = {};

  for (const key in updated) {
    if (typeof updated[key] === 'object' && updated[key] !== null && !Array.isArray(updated[key])) {
      const nested = getChangedFields(original[key] || {}, updated[key]);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    } else if (Array.isArray(updated[key])) {
      if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
        result[key] = updated[key];
      }
    } else {
      if (updated[key] !== original[key]) {
        result[key] = updated[key];
      }
    }
  }

  return result;
}

export function generateRandomPassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+{}[]:;<>,.?~";
  const all = upper + lower + numbers + symbols;

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle the password array
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}