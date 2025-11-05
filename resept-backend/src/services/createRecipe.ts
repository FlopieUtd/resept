import { supabaseAdmin } from "../lib/supabase";
import { type CreateRecipeData } from "../../types";

interface CreateRecipeRequest {
  recipeData: CreateRecipeData;
  userId: string;
}

interface CreateRecipeResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

export const createRecipe = async (
  request: CreateRecipeRequest
): Promise<CreateRecipeResult> => {
  try {
    const { recipeData, userId } = request;

    const { data, error } = await supabaseAdmin
      .from("recipes")
      .insert([
        {
          user_id: userId,
          title: recipeData.title,
          recipe_yield: recipeData.recipe_yield,
          recipe_category: recipeData.recipe_category,
          description: recipeData.description,
          prep_time: recipeData.prep_time,
          cook_time: recipeData.cook_time,
          total_time: recipeData.total_time,
          ingredients:
            Array.isArray(recipeData.ingredients) &&
            (recipeData as any).ingredients[0]?.raw
              ? [{ ingredients: (recipeData as any).ingredients }]
              : recipeData.ingredients,
          instructions: recipeData.instructions,
          source_url: recipeData.source_url,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating recipe:", error);
      return {
        success: false,
        error: error.message || "Failed to create recipe",
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error: any) {
    console.error("Error creating recipe:", error);
    return {
      success: false,
      error: error.message || "Failed to create recipe",
      data: null,
    };
  }
};
