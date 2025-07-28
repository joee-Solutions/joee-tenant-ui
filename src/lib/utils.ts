import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateFn = (date: string | Date = new Date()) => {
  return formatDate(new Date(date), "MMMM dd, yyyy");
};

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