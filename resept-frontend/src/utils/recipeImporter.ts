import type { Recipe, IngredientLine, Unit, IngredientType } from "../types";

interface JsonLdRecipe {
  "@type": "Recipe";
  name: string;
  description?: string;
  recipeYield?: string | number;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeCategory?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<
    | {
        "@type": "HowToStep";
        text: string;
      }
    | string
  >;
  url?: string;
}

const parseUnit = (ingredientText: string): Unit | undefined => {
  const unitMap: Record<string, Unit> = {
    gr: "GRAM",
    gram: "GRAM",
    grams: "GRAM",
    kg: "KILOGRAM",
    kilogram: "KILOGRAM",
    ml: "MILLILITER",
    milliliter: "MILLILITER",
    l: "LITER",
    liter: "LITER",
    tbsp: "TABLESPOON",
    tablespoon: "TABLESPOON",
    tsp: "TEASPOON",
    teaspoon: "TEASPOON",
    cup: "CUP",
    clove: "CLOVE",
    cloves: "CLOVE",
    can: "CAN",
    piece: "PIECE",
    pieces: "PIECE",
  };

  const lowerText = ingredientText.toLowerCase();
  for (const [key, unit] of Object.entries(unitMap)) {
    if (lowerText.includes(key)) {
      return unit;
    }
  }
  return undefined;
};

const parseAmount = (
  ingredientText: string
): { amount?: number; amountMax?: number } => {
  // Match patterns like "2-3", "2 to 3", "2-3 cups", etc.
  const rangeMatch = ingredientText.match(
    /(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?)/
  );
  if (rangeMatch) {
    return {
      amount: parseFloat(rangeMatch[1]),
      amountMax: parseFloat(rangeMatch[2]),
    };
  }

  // Match single numbers
  const singleMatch = ingredientText.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return { amount: parseFloat(singleMatch[1]) };
  }

  return {};
};

const parseIngredientType = (ingredientText: string): IngredientType => {
  const lowerText = ingredientText.toLowerCase();

  if (
    lowerText.includes("beef") ||
    lowerText.includes("chicken") ||
    lowerText.includes("pork") ||
    lowerText.includes("lamb") ||
    lowerText.includes("meat") ||
    lowerText.includes("bouillon")
  ) {
    return "MEAT";
  }

  if (
    lowerText.includes("fish") ||
    lowerText.includes("salmon") ||
    lowerText.includes("tuna") ||
    lowerText.includes("shrimp")
  ) {
    return "FISH";
  }

  if (
    lowerText.includes("butter") ||
    lowerText.includes("cheese") ||
    lowerText.includes("milk") ||
    lowerText.includes("cream") ||
    lowerText.includes("egg") ||
    lowerText.includes("yogurt") ||
    lowerText.includes("feta") ||
    lowerText.includes("parmesan")
  ) {
    return "VEGETARIAN";
  }

  return "VEGAN";
};

const parseIngredient = (ingredientText: string): IngredientLine => {
  const { amount, amountMax } = parseAmount(ingredientText);
  const unit = parseUnit(ingredientText);
  const ingredientType = parseIngredientType(ingredientText);

  // Extract name by removing amount and unit
  let name = ingredientText
    .replace(/^\d+(?:\.\d+)?\s*[-–to]?\s*\d+(?:\.\d+)?\s*/, "") // Remove amounts
    .replace(
      /^(gr|gram|grams|kg|kilogram|ml|milliliter|l|liter|tbsp|tablespoon|tsp|teaspoon|cup|clove|cloves|can|piece|pieces)\s+/i,
      ""
    ) // Remove unit
    .trim();

  // Extract qualifiers and notes in parentheses
  const noteMatch = name.match(/\(([^)]+)\)$/);
  const note = noteMatch ? noteMatch[1] : undefined;
  if (note) {
    name = name.replace(/\s*\([^)]+\)$/, "").trim();
  }

  // Extract qualifiers like "finely chopped", "minced", etc.
  const qualifierWords = [
    "finely",
    "coarsely",
    "minced",
    "chopped",
    "diced",
    "sliced",
    "grated",
    "crushed",
  ];
  let qualifier: string | undefined;

  for (const word of qualifierWords) {
    if (name.toLowerCase().includes(word)) {
      const regex = new RegExp(`\\b${word}\\b.*?$`, "i");
      const match = name.match(regex);
      if (match) {
        qualifier = match[0];
        name = name.replace(regex, "").trim();
        break;
      }
    }
  }

  return {
    raw: ingredientText,
    name: name || undefined,
    amount,
    amountMax,
    unit,
    qualifier,
    note,
    ingredientType,
  };
};

const parseTime = (timeString: string): string => {
  // Convert various time formats to ISO 8601 duration
  if (timeString.startsWith("PT")) return timeString; // Already ISO 8601

  const hourMatch = timeString.match(/(\d+)\s*h/i);
  const minuteMatch = timeString.match(/(\d+)\s*m/i);

  let result = "PT";
  if (hourMatch) result += `${hourMatch[1]}H`;
  if (minuteMatch) result += `${minuteMatch[1]}M`;

  return result === "PT" ? "PT0M" : result;
};

export const extractRecipeFromJsonLd = async (
  url: string
): Promise<Recipe | null> => {
  try {
    // Fetch the webpage
    const response = await fetch(url);
    const html = await response.text();

    // Extract JSON-LD script tags
    const jsonLdMatches = html.match(
      /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs
    );

    if (!jsonLdMatches) {
      console.warn("No JSON-LD found on page");
      return null;
    }

    // Find recipe data
    for (const match of jsonLdMatches) {
      const jsonContent = match
        .replace(/<script[^>]*>/, "")
        .replace(/<\/script>/, "");
      const data = JSON.parse(jsonContent);

      // Handle both single objects and arrays
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] === "Recipe") {
          const recipe: JsonLdRecipe = item;

          // Parse ingredients
          const recipeIngredient: IngredientLine[] = (
            recipe.recipeIngredient || []
          ).map(parseIngredient);

          // Parse instructions
          const recipeInstructions = (recipe.recipeInstructions || []).map(
            (instruction) => {
              if (typeof instruction === "string") {
                return { text: instruction };
              }
              return { text: instruction.text || "" };
            }
          );

          // Parse yield to number (use lower bound for ranges)
          let recipeYield = 4; // default
          if (recipe.recipeYield) {
            if (typeof recipe.recipeYield === "number") {
              recipeYield = recipe.recipeYield;
            } else {
              const yieldMatch = recipe.recipeYield.match(/(\d+)/);
              if (yieldMatch) {
                recipeYield = parseInt(yieldMatch[1]);
              }
            }
          }

          return {
            name: recipe.name,
            recipeYield,
            recipeCategory: recipe.recipeCategory || "Hoofdgerecht",
            description: recipe.description || "",
            prepTime: recipe.prepTime ? parseTime(recipe.prepTime) : "PT0M",
            cookTime: recipe.cookTime ? parseTime(recipe.cookTime) : "PT0M",
            totalTime: recipe.totalTime ? parseTime(recipe.totalTime) : "PT0M",
            recipeIngredient,
            recipeInstructions,
            sourceUrl: recipe.url || url,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting recipe:", error);
    return null;
  }
};

// Usage example:
// const recipe = await extractRecipeFromJsonLd("https://www.recipetineats.com/pastitsio-greek-pasta-bake/");
