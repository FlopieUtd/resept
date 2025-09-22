import { Link } from "react-router-dom";
import { useRecipes, useCreateRecipe } from "../lib/recipeService";
import { Loading } from "./Loading";
import { formatTime } from "../utils/formatTime";
import { RecipeEditModal } from "./RecipeEditModal";
import { Input } from "./Input";
import { PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Select } from "./Select";
import {
  type CreateRecipeData,
  type RecipeInstructionItem,
  type RecipeInstruction,
  type RecipeInstructionSection,
  type IngredientLine,
} from "../types";

export const Recipes = () => {
  const { data: recipes, isLoading, error, refetch } = useRecipes();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const createRecipe = useCreateRecipe();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<
    "alpha" | "date" | "ingredients" | "time"
  >("alpha");

  type RecipeListItem = {
    id: string;
    title?: string;
    created_at: string;
    ingredients: IngredientLine[];
    total_time?: string;
    instructions?: RecipeInstructionItem[];
  };

  const durationToMinutes = (timeString: string | null | undefined) => {
    if (!timeString) return 0;
    const iso = timeString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (iso) {
      const hours = parseInt(iso[1] || "0");
      const minutes = parseInt(iso[2] || "0");
      const seconds = parseInt(iso[3] || "0");
      return hours * 60 + minutes + Math.round(seconds / 60);
    }
    const hourLike = timeString.match(/(\d+)\s*(h|u)/i);
    const minLike = timeString.match(/(\d+)\s*m/i);
    const hours = hourLike ? parseInt(hourLike[1]) : 0;
    const mins = minLike ? parseInt(minLike[1]) : 0;
    if (hours || mins) return hours * 60 + mins;
    const numeric = parseInt(timeString);
    return isNaN(numeric) ? 0 : numeric;
  };

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    const q = query.trim().toLowerCase();

    let filtered = recipes;

    if (q !== "") {
      const words = q.split(/\s+/).filter(Boolean);

      const isSection = (
        item: RecipeInstructionItem
      ): item is RecipeInstructionSection => {
        return (item as RecipeInstructionSection).type === "section";
      };

      const instructionTexts = (items: RecipeInstructionItem[]): string => {
        return items
          .map((item) => {
            if (!item) return "";
            if (isSection(item)) {
              return [
                item.name || "",
                ...item.steps.map((s: RecipeInstruction) => s?.text || ""),
              ].join(" ");
            }
            return (item as RecipeInstruction).text || "";
          })
          .join(" ");
      };

      filtered = recipes.filter((recipe) => {
        const title = recipe.title || "";
        const ingredientsText = (recipe.ingredients || [])
          .map((i: IngredientLine) => i.raw || "")
          .join(" ");
        const instructionsText = instructionTexts(recipe.instructions || []);
        const haystack =
          `${title} ${ingredientsText} ${instructionsText}`.toLowerCase();
        return words.every((w) => haystack.includes(w));
      });
    }

    const byAlpha = (a: RecipeListItem, b: RecipeListItem) =>
      (a.title || "").localeCompare(b.title || "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
    const byDate = (a: RecipeListItem, b: RecipeListItem) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    const byIngredients = (a: RecipeListItem, b: RecipeListItem) =>
      (a.ingredients?.length || 0) - (b.ingredients?.length || 0);
    const byTotalTime = (a: RecipeListItem, b: RecipeListItem) =>
      durationToMinutes(a.total_time) - durationToMinutes(b.total_time);

    const comparators: Record<
      string,
      (a: RecipeListItem, b: RecipeListItem) => number
    > = {
      alpha: byAlpha,
      date: byDate,
      ingredients: byIngredients,
      time: byTotalTime,
    };

    const comparator = comparators[sortKey] || byAlpha;
    return [...filtered].sort(comparator);
  }, [recipes, query, sortKey]);

  const handleSave = async (recipeData: CreateRecipeData) => {
    try {
      await createRecipe.mutateAsync(recipeData);
      setIsEditModalOpen(false);
      // Manually refetch recipes to ensure the list updates
      await refetch();
      // Force component re-render
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create recipe:", error);
    }
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
  };

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] m-[12px] sm:m-[24px] flex-col">
        <div className="flex justify-between items-center mb-6 w-full border-b-2 border-black pb-[12px]">
          <h1 className="text-3xl font-bold">
            {recipes ? recipes.length : ""} Recepten
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-white text-black p-[8px] rounded-lg hover:bg-gray-200 transition-colors"
            >
              <PlusIcon size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex w-full h-full justify-center items-center py-8">
            <Loading />
          </div>
        ) : error ? (
          <div className="flex w-full justify-center items-center py-8">
            <div className="text-[24px] text-red-600">
              {error instanceof Error
                ? error.message
                : "Failed to fetch recipes"}
            </div>
          </div>
        ) : !recipes || recipes.length === 0 ? (
          <div className="flex w-full justify-center items-center py-8">
            <div className="text-[24px] text-gray-500">No recipes found</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="w-full flex gap-3 items-center">
              <div className="w-[75%]">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Zoek recepten..."
                />
              </div>
              <div className="w-[25%]">
                <Select
                  value={sortKey}
                  onChange={(e) =>
                    setSortKey(
                      e.target.value as
                        | "alpha"
                        | "date"
                        | "ingredients"
                        | "time"
                    )
                  }
                >
                  <option value="alpha">Naam</option>
                  <option value="date">Datum toegevoegd</option>
                  <option value="ingredients">Aantal ingrediënten</option>
                  <option value="time">Totale kooktijd</option>
                </Select>
              </div>
            </div>
            {filteredRecipes.length === 0 ? (
              <div className="flex w-full justify-center items-center py-8">
                <div className="text-[24px] text-gray-500">
                  No recipes match your search
                </div>
              </div>
            ) : (
              <div
                className="grid sm:grid-cols-2 gap-4 pb-[24px]"
                key={refreshTrigger}
              >
                {filteredRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    to={`/recipes/${recipe.id}`}
                    className="flex flex-col cursor-pointer bg-[#f9f9f9]  hover:bg-white hover:border-black border-2 border-[#f9f9f9] p-[12px] gap-[6px]"
                  >
                    <h2 className="text-xl font-semibold line-clamp-3 overflow-hidden">
                      {recipe.title}
                    </h2>
                    <div className="flex gap-[6px] items-center text-[14px]">
                      {recipe.ingredients.length > 0 && (
                        <div className="">
                          {recipe.ingredients.length} ingrediënten
                        </div>
                      )}
                      {recipe.total_time && <div>●</div>}
                      {recipe.total_time && (
                        <div className="">{formatTime(recipe.total_time)}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <RecipeEditModal
        isOpen={isEditModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        title="Nieuw recept"
        initialData={{
          title: "",
          recipe_yield: 1,
          recipe_category: "",
          description: "",
          prep_time: "",
          cook_time: "",
          total_time: "",
          ingredients: [{ raw: "" }],
          instructions: [{ text: "" }],
          source_url: "",
        }}
        isSaving={createRecipe.isPending}
        showImport={true}
      />
    </div>
  );
};
