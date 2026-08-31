import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isTomorrow, isYesterday, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEventTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    return format(date, "h:mm a");
  } catch {
    return isoString;
  }
}

export function formatEventDate(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEE, MMM d");
  } catch {
    return isoString;
  }
}

export function getDurationFormatted(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
