import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDueDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d < today) {
    return `⚠ ${d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`;
  }
  if (d.toDateString() === today.toDateString()) return "Dziś";
  if (d.toDateString() === tomorrow.toDateString()) return "Jutro";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
