import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { fetchHtmlWithBrowser } from "../utils/fetchHtmlWithBrowser.js";
import { detectSiteType } from "../utils/detectSiteType.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";
import { extractTextNodes } from "../utils/extractTextNodes.js";
import { preparseNodes } from "../utils/preparseNodes.js";
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
      console.log(`Site detected as needing browser, using headless browser...`);
      
      // Try multiple browser configurations for better success rate
      const browserConfigs = [
        {
          waitForTimeout: 8000,
          waitForNetworkIdle: true,
          maxWaitTime: 25000,
        },
        {
          waitForTimeout: 12000,
          waitForNetworkIdle: true,
          maxWaitTime: 35000,
        },
        {
          waitForTimeout: 15000,
          waitForNetworkIdle: false,
          maxWaitTime: 45000,
        }
      ];

      // Also try different URL variations for Cloudflare-protected sites
      const urlVariations = [
        url,
        url + '?v=' + Date.now(),
        url + '?t=' + Math.random().toString(36).substring(7),
        url.replace('https://', 'https://www.'),
        url.replace('www.', '')
      ].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

      let browserSuccess = false;
      let bestHtml = html;
      
      // Try each URL variation with each browser configuration
      for (const urlVariation of urlVariations) {
        if (browserSuccess) break;
        
        for (let i = 0; i < browserConfigs.length; i++) {
          try {
            console.log(`Trying URL: ${urlVariation} with browser configuration ${i + 1}/${browserConfigs.length}...`);
            const resultHtml = await fetchHtmlWithBrowser(urlVariation, browserConfigs[i]);
            
            // Check if we got actual content (not just Cloudflare challenge)
            const isCloudflareChallenge = resultHtml.includes("Just a moment...") || 
                                        resultHtml.includes("Verifying you are human") ||
                                        resultHtml.includes("challenge-platform");
            
            if (!isCloudflareChallenge && resultHtml.length > 5000) {
              html = resultHtml;
              console.log("Headless browser fetch completed successfully with real content");
              browserSuccess = true;
              break;
            } else if (resultHtml.length > bestHtml.length) {
              bestHtml = resultHtml;
              console.log(`Got more content (${resultHtml.length} chars) but still Cloudflare challenge, keeping as fallback`);
            }
          } catch (browserError: any) {
            console.log(
              `URL ${urlVariation} with browser configuration ${i + 1} failed:`,
              browserError.message
            );
          }
        }
      }

      // If we didn't get real content, use the best we found
      if (!browserSuccess && bestHtml.length > html.length) {
        html = bestHtml;
        console.log("Using best available content despite Cloudflare challenge");
      }

      // If still no success, try alternative approaches
      if (!browserSuccess) {
        console.log("All browser approaches failed, trying alternative HTTP approaches...");
        
        for (const urlVariation of urlVariations) {
          try {
            console.log(`Trying alternative HTTP approach for: ${urlVariation}`);
            const alternativeHtml = await fetchHtmlFromUrl(urlVariation);
            if (alternativeHtml && alternativeHtml.length > html.length) {
              html = alternativeHtml;
              console.log("Alternative HTTP approach successful");
              browserSuccess = true;
              break;
            }
          } catch (altError: any) {
            console.log(`Alternative HTTP approach failed for ${urlVariation}:`, altError.message);
          }
        }
      }

      if (!browserSuccess) {
        console.log("All browser and alternative approaches failed, using original HTML");
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

    // Step 4: No JSON-LD found, extract recipe components from HTML
    console.log(
      "No JSON-LD found, extracting recipe components from HTML..."
    );
    const textNodes = extractTextNodes(html);

    console.log(html)
    const parsedNodes = preparseNodes(textNodes);
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
