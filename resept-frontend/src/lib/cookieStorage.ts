import type { SupportedStorage } from "@supabase/supabase-js";

const getExpiryDate = (days: number) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toUTCString();
};

const isBrowser = typeof document !== "undefined";

export const cookieStorage: SupportedStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    const name = `${key}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const parts = decodedCookie.split(";");
    for (let part of parts) {
      part = part.trim();
      if (part.startsWith(name)) {
        return part.substring(name.length);
      }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; expires=${getExpiryDate(30)}; path=/; SameSite=Lax`;
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  },
};
