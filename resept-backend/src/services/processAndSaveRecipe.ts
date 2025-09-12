import { extractRecipeFromHtml } from "./recipeExtractionService.js";
import { createRecipe } from "./createRecipe.js";
import { type CreateRecipeData } from "../../types.js";

interface ProcessAndSaveRecipeRequest {
  html: string;
  url?: string;
  userId: string;
}

interface ProcessAndSaveRecipeResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

export const processAndSaveRecipe = async (
  request: ProcessAndSaveRecipeRequest
): Promise<ProcessAndSaveRecipeResult> => {
  try {
    const { html, url, userId } = request;
    console.log("REQUYEST", request);

    console.log("🔄 Processing and saving recipe", {
      htmlLength: html.length,
      url: url || "not provided",
      userId: userId,
    });

    // Step 1: Extract recipe from HTML
    const extractionResult = await extractRecipeFromHtml(html, url);

    if (!extractionResult.success) {
      console.error("❌ Recipe extraction failed:", extractionResult.error);
      return {
        success: false,
        error: extractionResult.error || "Failed to extract recipe",
        data: null,
      };
    }

    const extractedRecipe = extractionResult.data;
    console.log("✅ Recipe extracted successfully:", {
      title: extractedRecipe.title,
      ingredientsCount: extractedRecipe.ingredients?.length || 0,
      instructionsCount: extractedRecipe.instructions?.length || 0,
    });

    // Step 2: Transform to CreateRecipeData format
    const recipeData: CreateRecipeData = {
      title: extractedRecipe.title || "Untitled Recipe",
      recipe_yield: extractedRecipe.recipe_yield || 1,
      recipe_category: extractedRecipe.recipe_category || "Main Course",
      description: extractedRecipe.description || "",
      prep_time: extractedRecipe.prep_time || "",
      cook_time: extractedRecipe.cook_time || "",
      total_time: extractedRecipe.total_time || "",
      ingredients: extractedRecipe.ingredients || [],
      instructions: extractedRecipe.instructions || [],
      source_url: url || "",
    };

    console.log("📝 Recipe data prepared for saving:", {
      title: recipeData.title,
      yield: recipeData.recipe_yield,
      category: recipeData.recipe_category,
      ingredientsCount: recipeData.ingredients.length,
      instructionsCount: recipeData.instructions.length,
    });

    // Step 3: Save to Supabase
    const saveResult = await createRecipe({
      recipeData,
      userId,
    });

    if (!saveResult.success) {
      console.error("❌ Failed to save recipe to Supabase:", saveResult.error);
      return {
        success: false,
        error: saveResult.error || "Failed to save recipe to database",
        data: null,
      };
    }

    console.log("✅ Recipe saved to Supabase successfully:", {
      recipeId: saveResult.data?.id,
      title: saveResult.data?.title,
    });

    return {
      success: true,
      error: null,
      data: saveResult.data,
    };
  } catch (error: any) {
    console.error("💥 Error in processAndSaveRecipe:", error);
    return {
      success: false,
      error: error.message || "Failed to process and save recipe",
      data: null,
    };
  }
};
