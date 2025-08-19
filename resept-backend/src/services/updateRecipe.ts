import { parseIngredient } from "../utils/parseIngredient.js";
import { type CreateRecipeData, type IngredientLine } from "../../types.js";

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
      const reparsedIngredients: IngredientLine[] = updates.ingredients.map(
        (ingredient) => {
          if (typeof ingredient === "string") {
            // If ingredient is a raw string, parse it
            const parsed = parseIngredient(ingredient);
            return {
              raw: ingredient,
              parsed,
            };
          } else if (ingredient.raw) {
            // If ingredient has a raw property, parse that
            const parsed = parseIngredient(ingredient.raw);
            return {
              raw: ingredient.raw,
              parsed,
            };
          } else {
            // If ingredient is already parsed, keep it as is
            return ingredient;
          }
        }
      );

      updates.ingredients = reparsedIngredients;
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
