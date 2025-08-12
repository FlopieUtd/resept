interface JsonLdRecipe {
  "@type"?: string | string[];
  "@graph"?: Array<{ "@type": string; [key: string]: any }>;
  title?: string;
  name?: string;
  headline?: string;
  description?: string;
  about?: string;
  recipe_yield?: any;
  recipeYield?: any;
  yield?: any;
  servings?: any;
  recipeServings?: any;
  recipe_category?: string | string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeInstructions?: any;
  recipeIngredient?: any;
  [key: string]: any;
}

interface TransformedRecipe {
  title: string;
  recipe_yield: number;
  recipe_category: string;
  description: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  ingredients: Array<{ raw: string }>;
  instructions: Array<{ text: string }>;
  source: string;
}

// HTML entity decoding function
const decodeHtmlEntities = (text: any): string => {
  if (typeof text !== "string") return text;

  const htmlEntities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  };

  return text.replace(/&[#\w]+;/g, (entity: string) => {
    return htmlEntities[entity] || entity;
  });
};

export const transformJsonLdToRecipe = (
  jsonLdRecipe: JsonLdRecipe,
  sourceUrl: string
): TransformedRecipe | null => {
  if (!jsonLdRecipe) {
    return null;
  }

  console.log(
    "Transforming JSON-LD recipe:",
    JSON.stringify(jsonLdRecipe, null, 2)
  );

  // Handle @graph structure - find the Recipe object
  let recipe = jsonLdRecipe;
  if (jsonLdRecipe["@graph"] && Array.isArray(jsonLdRecipe["@graph"])) {
    const recipeItem = jsonLdRecipe["@graph"].find(
      (item) => item["@type"] === "Recipe"
    );
    if (recipeItem) {
      recipe = recipeItem;
      console.log("Found recipe in @graph:", JSON.stringify(recipe, null, 2));
    }
  }

  // Extract basic recipe information with better fallbacks
  const title = decodeHtmlEntities(
    recipe.title || recipe.name || recipe.headline || "Untitled Recipe"
  );
  const description = decodeHtmlEntities(
    recipe.description || recipe.about || ""
  );

  // Handle recipe_yield - could be string or array
  // Check multiple common JSON-LD field names for recipe yield
  let recipe_yield = 1;
  const yieldValue =
    recipe.recipe_yield ||
    recipe.recipeYield ||
    recipe.yield ||
    recipe.servings ||
    recipe.recipeServings;

  if (yieldValue) {
    if (Array.isArray(yieldValue)) {
      // Try to extract number from first yield item
      const firstYield = yieldValue[0];
      if (typeof firstYield === "string") {
        const match = firstYield.match(/(\d+)/);
        if (match) {
          recipe_yield = parseInt(match[1], 10);
        }
      } else if (typeof firstYield === "number") {
        recipe_yield = firstYield;
      }
    } else if (typeof yieldValue === "string") {
      const match = yieldValue.match(/(\d+)/);
      if (match) {
        recipe_yield = parseInt(match[1], 10);
      }
    } else if (typeof yieldValue === "number") {
      recipe_yield = yieldValue;
    }
  }

  // Handle recipe_category - could be string or array
  let recipe_category = "Recepten";
  if (recipe.recipe_category) {
    if (Array.isArray(recipe.recipe_category)) {
      recipe_category = recipe.recipe_category[0] || "Recepten";
    } else {
      recipe_category = recipe.recipe_category;
    }
  }

  // Handle times - store ISO 8601 duration format
  const parseDuration = (duration: any): string => {
    if (!duration) return "PT0M";

    // If already in ISO 8601 format, return as is
    if (typeof duration === "string" && duration.startsWith("PT"))
      return duration;

    // Try to parse various duration formats
    if (typeof duration === "string") {
      // Handle "PT1H30M" format
      if (duration.includes("PT")) return duration;

      // Handle "1 hour 30 minutes" format
      const hours = duration.match(/(\d+)\s*hour/);
      const minutes = duration.match(/(\d+)\s*minute/);

      if (hours || minutes) {
        const h = hours ? parseInt(hours[1], 10) : 0;
        const m = minutes ? parseInt(minutes[1], 10) : 0;
        return `PT${h}H${m}M`;
      }
    }

    return "PT0M";
  };

  const prep_time = parseDuration(recipe.prepTime);
  const cook_time = parseDuration(recipe.cookTime);
  const total_time = parseDuration(recipe.totalTime);

  // Handle ingredients
  const ingredients: Array<{ raw: string }> = [];
  if (recipe.recipeIngredient && Array.isArray(recipe.recipeIngredient)) {
    recipe.recipeIngredient.forEach((ingredient: any) => {
      if (ingredient && typeof ingredient === "string") {
        ingredients.push({ raw: decodeHtmlEntities(ingredient) });
      }
    });
  }

  // Handle instructions
  const instructions: Array<{ text: string }> = [];
  if (recipe.recipeInstructions && Array.isArray(recipe.recipeInstructions)) {
    recipe.recipeInstructions.forEach((instruction: any) => {
      if (instruction && typeof instruction === "string") {
        instructions.push({ text: decodeHtmlEntities(instruction) });
      } else if (
        instruction &&
        typeof instruction === "object" &&
        instruction.text
      ) {
        // Handle HowToStep objects with text field
        instructions.push({ text: decodeHtmlEntities(instruction.text) });
      }
    });
  }

  return {
    title,
    recipe_yield,
    recipe_category,
    description,
    prep_time,
    cook_time,
    total_time,
    ingredients,
    instructions,
    source: sourceUrl,
  };
};
