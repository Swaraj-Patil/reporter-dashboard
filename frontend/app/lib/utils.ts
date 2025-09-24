import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const camelCaseToEnglish = (s: string) => {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};