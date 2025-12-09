import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateToLocale = (dateString: string, locale = "pt-BR") => {
  if (!dateString) return "";

  const [datePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);

  if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(locale);
  }

  const parsedDate = new Date(dateString);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleDateString(locale);
};

export const formatTimeToHoursMinutes = (timeString: string) => {
  if (!timeString) return "";

  const match = timeString.match(/(\d{1,2}):(\d{2})/);

  if (match) {
    const [, hour, minute] = match;
    return `${hour.padStart(2, "0")}:${minute}`;
  }

  return timeString;
};
