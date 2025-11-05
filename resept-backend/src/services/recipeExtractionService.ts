import { fetchHtmlFromUrl as fetchHtmlFromUrlUtil } from "../utils/fetchHtmlFromUrl";
import { fetchHtmlWithBrowser } from "../utils/fetchHtmlWithBrowser";
import { detectSiteType } from "../utils/detectSiteType";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe";
import { extractTextNodes } from "../utils/extractTextNodes";
import { parseNodes } from "../utils/parseNodes";
import { extractTitle } from "../utils/extractTitle";
import { extractYield } from "../utils/extractYield";

export interface RecipeResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

interface BrowserOptions {
  waitForTimeout: number;
  waitForNetworkIdle: boolean;
  maxWaitTime: number;
}

export const processRecipeExtraction = async (
  html: string,
  url?: string
): Promise<RecipeResult> => {
  try {
    // Step 1: Detect recipe JSON-LD
    const jsonLdRecipes = detectRecipeJsonLd(html);

    // Step 2: Transform JSON-LD to desired recipe format
    if (jsonLdRecipes && jsonLdRecipes.length > 0) {
      // Take the first recipe if multiple are found
      const jsonLdRecipe = jsonLdRecipes[0];
      const recipe = transformJsonLdToRecipe(jsonLdRecipe, url || "");

      // Check if the recipe was successfully transformed and has valid ingredients and instructions
      if (recipe) {
        const hasValidIngredients =
          recipe.ingredients &&
          Array.isArray(recipe.ingredients) &&
          recipe.ingredients.length > 0;

        const hasValidInstructions =
          recipe.instructions &&
          Array.isArray(recipe.instructions) &&
          recipe.instructions.length > 0;

        if (hasValidIngredients && hasValidInstructions) {
          return {
            success: true,
            error: null,
            data: recipe,
          };
        } else {
          console.log(
            "JSON-LD recipe has empty ingredients or instructions, falling back to HTML extraction"
          );
        }
      } else {
        console.log(
          "Failed to transform JSON-LD recipe, falling back to HTML extraction"
        );
      }
    }

    // Step 3: No JSON-LD found, extract recipe components from HTML
    const textNodes = extractTextNodes(html);

    const parsedNodes = parseNodes(textNodes);
    const title = extractTitle(html, url || "");
    const recipeYield = extractYield(textNodes);

    // Validate recipe based on probability scores
    const RECIPE_VALIDATION_THRESHOLD = 0.3; // Adjust this threshold as needed
    const isRecipeValid =
      parsedNodes.maxIngredientProbability >= RECIPE_VALIDATION_THRESHOLD &&
      parsedNodes.maxInstructionsProbability >= RECIPE_VALIDATION_THRESHOLD;

    if (!isRecipeValid) {
      console.log("Recipe validation failed - low probability scores:", {
        ingredientProbability: parsedNodes.maxIngredientProbability,
        instructionsProbability: parsedNodes.maxInstructionsProbability,
        threshold: RECIPE_VALIDATION_THRESHOLD,
      });
      return {
        success: false,
        error: "No recipe detected",
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        title,
        ingredients: parsedNodes.ingredients,
        instructions: parsedNodes.instructions,
        recipe_yield: recipeYield,
      },
    };
  } catch (error: any) {
    console.error("Error extracting recipe:", error);
    return {
      success: false,
      error: error.message || "Failed to extract recipe",
      data: null,
    };
  }
};

export const fetchHtmlFromUrl = async (
  url: string
): Promise<{
  success: boolean;
  error: string | null;
  data: { html: string } | null;
}> => {
  try {
    // Step 1: Try fast HTML fetch first
    let html: string = await fetchHtmlFromUrlUtil(url);

    // Step 1.5: If site needs browser rendering, use headless browser
    const siteAnalysis = detectSiteType(html);
    if (siteAnalysis.needsBrowser) {
      try {
        const browserOptions: BrowserOptions = {
          waitForTimeout: 5000,
          waitForNetworkIdle: true,
          maxWaitTime: 15000,
        };
        html = await fetchHtmlWithBrowser(url, browserOptions);
      } catch (browserError: any) {
        console.log(
          "Headless browser failed, continuing with original HTML:",
          browserError.message
        );
      }
    }

    return {
      success: true,
      error: null,
      data: { html },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch HTML from URL",
      data: null,
    };
  }
};

export const extractRecipeFromHtml = async (
  html: string,
  url?: string
): Promise<RecipeResult> => {
  try {
    // Validate HTML content
    if (!html || html.trim().length === 0) {
      return {
        success: false,
        error: "HTML content is empty",
        data: null,
      };
    }

    // Check HTML size limit (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (html.length > maxSize) {
      return {
        success: false,
        error: "HTML content is too large (max 10MB)",
        data: null,
      };
    }

    // Process the HTML directly
    return await processRecipeExtraction(html, url);
  } catch (error: any) {
    console.error("Error extracting recipe from HTML:", error);
    return {
      success: false,
      error: error.message || "Failed to extract recipe from HTML",
      data: null,
    };
  }
};
