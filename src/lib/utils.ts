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