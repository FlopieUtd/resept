import { fetchHtmlFromUrl } from "../utils/fetchHtmlFromUrl.js";
import { detectRecipeJsonLd } from "../utils/detectRecipeJsonLd.js";
import { transformJsonLdToRecipe } from "../utils/transformJsonLdToRecipe.js";

export const extractRecipe = async (url) => {
  console.log("ready to extract");

  // Step 1: Fetch html from url
  const html = await fetchHtmlFromUrl(url);

  // Step 2: Detect recipe JSON-LD
  const jsonLdRecipes = detectRecipeJsonLd(html);

  console.log(
    "Detected JSON-LD recipes:",
    JSON.stringify(jsonLdRecipes, null, 2)
  );

  // Step 3: Transform JSON-LD to desired recipe format
  let recipe = null;
  if (jsonLdRecipes && jsonLdRecipes.length > 0) {
    // Take the first recipe if multiple are found
    const jsonLdRecipe = jsonLdRecipes[0];
    console.log("Transforming recipe:", JSON.stringify(jsonLdRecipe, null, 2));
    recipe = transformJsonLdToRecipe(jsonLdRecipe, url);
    console.log("Transformed recipe:", JSON.stringify(recipe, null, 2));
  }

  return {
    url: url,
    html: recipe ? null : html,
    recipe: recipe,
  };
};
