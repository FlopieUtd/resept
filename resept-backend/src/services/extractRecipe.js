import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";

export const extractRecipe = async (url) => {
  try {
    console.log("ready to extract");

    // Step 1: Fetch html from url
    const html = await fetchHtmlFromUrl(url);

    // Step 2: Detect recipe JSON-LD
    const jsonLdRecipes = detectRecipeJsonLd(html);

    // Step 3: Transform JSON-LD to desired recipe format
    let recipe = null;
    if (jsonLdRecipes && jsonLdRecipes.length > 0) {
      // Take the first recipe if multiple are found
      const jsonLdRecipe = jsonLdRecipes[0];
      recipe = transformJsonLdToRecipe(jsonLdRecipe, url);
    }

    if (!recipe) {
      return {
        success: false,
        error: "No recipe found on the provided URL",
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: recipe,
    };
  } catch (error) {
    console.error("Error extracting recipe:", error);
    return {
      success: false,
      error: error.message || "Failed to extract recipe",
      data: null,
    };
  }
};
