import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { fetchHtmlWithBrowser } from "../utils/fetchHtmlWithBrowser.js";
import { detectSiteType } from "../utils/detectSiteType.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";
import { extractTextNodes } from "../utils/extractTextNodes.js";
import { preparseIngredientNodes } from "../utils/preparseIngredientNodes.js";
import { extractTitle } from "../utils/extractTitle.js";
import { extractYield } from "../utils/extractYield.js";

interface RecipeResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

interface BrowserOptions {
  waitForTimeout: number;
  waitForNetworkIdle: boolean;
  maxWaitTime: number;
}

export const extractRecipe = async (url: string): Promise<RecipeResult> => {
  try {
    console.log("Ready to extract");

    // Step 1: Try fast HTML fetch first
    let html: string = await fetchHtmlFromUrl(url);

    // Step 1.5: If site needs browser rendering, use headless browser
    const siteAnalysis = detectSiteType(html);
    if (siteAnalysis.needsBrowser) {
      console.log(`Site detected as SPA, using headless browser...`);
      try {
        const browserOptions: BrowserOptions = {
          waitForTimeout: 5000,
          waitForNetworkIdle: true,
          maxWaitTime: 15000,
        };
        html = await fetchHtmlWithBrowser(url, browserOptions);
        console.log("Headless browser fetch completed successfully");
      } catch (browserError: any) {
        console.log(
          "Headless browser failed, continuing with original HTML:",
          browserError.message
        );
      }
    }

    // Step 2: Detect recipe JSON-LD
    const jsonLdRecipes = detectRecipeJsonLd(html);

    // Step 3: Transform JSON-LD to desired recipe format
    if (jsonLdRecipes && jsonLdRecipes.length > 0) {
      // Take the first recipe if multiple are found
      const jsonLdRecipe = jsonLdRecipes[0];
      const recipe = transformJsonLdToRecipe(jsonLdRecipe, url);

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

    // Step 4: No JSON-LD found, use LLM to extract recipe components from clean HTML
    console.log(
      "No JSON-LD found, using LLM to extract recipe components from HTML..."
    );
    const textNodes = extractTextNodes(html);
    const parsedNodes = preparseIngredientNodes(textNodes);
    const title = extractTitle(html, url);
    const recipeYield = extractYield(html);

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
