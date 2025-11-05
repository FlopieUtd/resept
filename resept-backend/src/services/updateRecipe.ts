import { parseIngredient } from "../utils/parseIngredient";
import { type CreateRecipeData, type IngredientLine } from "../../types";

interface UpdateRecipeRequest {
  recipeId: string;
  updates: Partial<CreateRecipeData>;
}

interface UpdateRecipeResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

export const updateRecipe = async (
  request: UpdateRecipeRequest
): Promise<UpdateRecipeResult> => {
  try {
    const { recipeId, updates } = request;

    // If ingredients are being updated, re-parse them
    if (updates.ingredients && Array.isArray(updates.ingredients)) {
      // Support both grouped and legacy flat arrays
      const isGrouped =
        updates.ingredients.length > 0 &&
        (updates.ingredients as any)[0]?.ingredients;

      if (isGrouped) {
        const reparsedGroups = (updates.ingredients as any).map(
          (group: any) => {
            const lines = Array.isArray(group.ingredients)
              ? group.ingredients
              : [];
            const reparsedLines = lines.map((ingredient: any) => {
              if (typeof ingredient === "string") {
                const parsed = parseIngredient(ingredient);
                return { raw: ingredient, parsed } as IngredientLine;
              } else if (ingredient?.raw) {
                const parsed = parseIngredient(ingredient.raw);
                return { raw: ingredient.raw, parsed } as IngredientLine;
              }
              return ingredient as IngredientLine;
            });
            return { title: group.title, ingredients: reparsedLines };
          }
        );
        (updates as any).ingredients = reparsedGroups;
      } else {
        const reparsedFlat: IngredientLine[] = (updates.ingredients as any).map(
          (ingredient: any) => {
            if (typeof ingredient === "string") {
              const parsed = parseIngredient(ingredient);
              return { raw: ingredient, parsed } as IngredientLine;
            } else if (ingredient?.raw) {
              const parsed = parseIngredient(ingredient.raw);
              return { raw: ingredient.raw, parsed } as IngredientLine;
            }
            return ingredient as IngredientLine;
          }
        );
        (updates as any).ingredients = [{ ingredients: reparsedFlat }];
      }
    }

    // Return the updated data with reparsed ingredients
    return {
      success: true,
      error: null,
      data: {
        id: recipeId,
        ...updates,
      },
    };
  } catch (error: any) {
    console.error("Error updating recipe:", error);
    return {
      success: false,
      error: error.message || "Failed to update recipe",
      data: null,
    };
  }
};
