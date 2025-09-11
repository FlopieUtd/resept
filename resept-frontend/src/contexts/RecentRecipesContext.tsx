import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
// import { type DatabaseRecipe } from "../types";

interface RecentRecipe {
  id: string;
  title: string;
  visitedAt: number;
}

interface RecentRecipesContextType {
  recentRecipes: RecentRecipe[];
  addRecentRecipe: (recipe: any) => void;
  clearRecentRecipes: () => void;
  removeRecentRecipe: (recipeId: string) => void;
}

const RecentRecipesContext = createContext<
  RecentRecipesContextType | undefined
>(undefined);

const STORAGE_KEY = "recentRecipes";
const MAX_RECENT_RECIPES = 10;

export const RecentRecipesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentRecipes(parsed);
        }
      } catch (error) {
        console.error(
          "Failed to parse recent recipes from localStorage:",
          error
        );
      }
    }
  }, []);

  const addRecentRecipe = useCallback((recipe: any) => {
    setRecentRecipes((prev) => {
      const now = Date.now();
      const newRecentRecipe: RecentRecipe = {
        id: recipe.id,
        title: recipe.title,
        visitedAt: now,
      };

      const filtered = prev.filter((r) => r.id !== recipe.id);
      const updated = [newRecentRecipe, ...filtered].slice(
        0,
        MAX_RECENT_RECIPES
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentRecipes = useCallback(() => {
    setRecentRecipes([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeRecentRecipe = useCallback((recipeId: string) => {
    setRecentRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== recipeId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <RecentRecipesContext.Provider
      value={{
        recentRecipes,
        addRecentRecipe,
        clearRecentRecipes,
        removeRecentRecipe,
      }}
    >
      {children}
    </RecentRecipesContext.Provider>
  );
};

export const useRecentRecipes = () => {
  const context = useContext(RecentRecipesContext);
  if (context === undefined) {
    throw new Error(
      "useRecentRecipes must be used within a RecentRecipesProvider"
    );
  }
  return context;
};
