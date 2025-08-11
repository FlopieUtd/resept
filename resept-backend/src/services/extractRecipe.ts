import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { fetchHtmlWithBrowser } from "../utils/fetchHtmlWithBrowser.js";
import { detectSiteType } from "../utils/detectSiteType.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";
import { extractTextContent, cleanHtml } from "../utils/extractTextContent.js";
import { extractRecipeWithLlm } from "../utils/llmRecipeExtractor.js";

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

    // Step 4: No JSON-LD found, use LLM to extract recipe from clean HTML
    console.log("No JSON-LD found, using LLM to extract recipe from HTML...");
    const cleanHtmlContent = cleanHtml(html);

    const llmResult = await extractRecipeWithLlm({
      cleanHtml: cleanHtmlContent,
      sourceUrl: url,
    });

    if (llmResult.success && llmResult.recipe) {
      console.log("LLM successfully extracted recipe");
      return {
        success: true,
        error: null,
        data: llmResult.recipe,
      };
    }

    // Step 5: LLM extraction failed, return error
    console.log("LLM extraction failed, returning error");
    return {
      success: false,
      error: llmResult.error || "Failed to extract recipe from HTML content",
      data: null,
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
