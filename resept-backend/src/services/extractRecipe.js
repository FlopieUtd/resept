import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { fetchHtmlWithBrowser } from "../utils/fetchHtmlWithBrowser.js";
import { detectSiteType } from "../utils/detectSiteType.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";

export const extractRecipe = async (url) => {
  try {
    console.log("Ready to extract");

    // Step 1: Try fast HTML fetch first
    let html = await fetchHtmlFromUrl(url);

    // Step 1.5: If site needs browser rendering, use headless browser
    const siteAnalysis = detectSiteType(html);
    if (siteAnalysis.needsBrowser) {
      console.log(`Site detected as SPA, using headless browser...`);
      try {
        html = await fetchHtmlWithBrowser(url, {
          waitForTimeout: 3000,
          waitForNetworkIdle: true,
          maxWaitTime: 10000,
        });
        console.log("Headless browser fetch completed successfully");
      } catch (browserError) {
        console.log(
          "Headless browser failed, continuing with original HTML:",
          browserError.message
        );
      }
    }

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
