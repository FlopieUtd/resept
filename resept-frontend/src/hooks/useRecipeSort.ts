import { useState, useEffect } from "react";

type SortKey = "alpha" | "date" | "ingredients" | "time";

const STORAGE_KEY = "recipeSortPreference";
const DEFAULT_SORT: SortKey = "alpha";

export const useRecipeSort = () => {
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["alpha", "date", "ingredients", "time"].includes(stored)) {
        return stored as SortKey;
      }
    } catch (error) {
      console.error("Failed to read sort preference from localStorage:", error);
    }
    return DEFAULT_SORT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, sortKey);
    } catch (error) {
      console.error("Failed to save sort preference to localStorage:", error);
    }
  }, [sortKey]);

  return [sortKey, setSortKey] as const;
};
