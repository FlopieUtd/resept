import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { fetchHtmlWithBrowser } from "../utils/fetchHtmlWithBrowser.js";
import { detectSiteType } from "../utils/detectSiteType.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";
import { extractTextContent, cleanHtml } from "../utils/extractTextContent.js";

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
          waitForTimeout: 3000,
          waitForNetworkIdle: true,
          maxWaitTime: 10000,
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

      return {
        success: true,
        error: null,
        data: recipe,
      };
    }

    // Step 4: No JSON-LD found, provide clean HTML for LLM processing
    console.log("No JSON-LD found, providing clean HTML for LLM processing...");
    const cleanHtmlContent = cleanHtml(html);

    return {
      success: true,
      error: null,
      data: {
        source: url,
        extractedFrom: "HTML Structure",
        cleanHtml: cleanHtmlContent,
        message: "Recipe data extracted as clean HTML for LLM processing",
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
