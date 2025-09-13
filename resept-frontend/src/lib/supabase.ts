import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Custom storage that extends session lifetime
const customStorage = {
  getItem: (key: string) => {
    const item = window.localStorage.getItem(key);
    if (item && key.includes("supabase.auth.token")) {
      try {
        const parsed = JSON.parse(item);
        // Extend the expiry time by 30 days whenever accessed
        if (parsed.expires_at) {
          parsed.expires_at = parsed.expires_at + 30 * 24 * 60 * 60; // Add 30 days
          window.localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (e) {
        // If parsing fails, return original item
      }
    }
    return item;
  },
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: customStorage,
    storageKey: "supabase.auth.token",
    flowType: "pkce",
  },
});
