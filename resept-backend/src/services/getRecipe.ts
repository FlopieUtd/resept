import { supabase } from "../lib/supabase.js";

interface GetRecipeRequest {
  recipeId: string;
  userId: string;
}

interface GetRecipeResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

export const getRecipe = async (
  request: GetRecipeRequest
): Promise<GetRecipeResult> => {
  try {
    const { recipeId, userId } = request;

    // First, fetch the recipe
    const { data: recipe, error: fetchError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching recipe:", fetchError);
      return {
        success: false,
        error: fetchError.message || "Failed to fetch recipe",
        data: null,
      };
    }

    if (!recipe) {
      return {
        success: false,
        error: "Recipe not found",
        data: null,
      };
    }

    // Update last_visited timestamp (fire and forget - don't wait for this)
    const now = new Date().toISOString();
    supabase
      .from("recipes")
      .update({ last_visited: now })
      .eq("id", recipeId)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) {
          console.error("Error updating last_visited:", error);
        }
      });

    return {
      success: true,
      error: null,
      data: recipe,
    };
  } catch (error: any) {
    console.error("Error getting recipe:", error);
    return {
      success: false,
      error: error.message || "Failed to get recipe",
      data: null,
    };
  }
};