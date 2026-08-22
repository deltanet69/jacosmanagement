import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return (
    trimmed.length > 5 &&
    trimmed !== "-" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  );
}

export function getFirstValidEmail(...candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (isValidEmail(candidate)) {
      return candidate!.trim();
    }
  }
  return null;
}

