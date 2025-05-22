import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateFn = (date: string | Date = new Date()) => {
  return formatDate(new Date(date), "MMMM dd, yyyy");
};