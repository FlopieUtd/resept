// HTML entity decoding function
const decodeHtmlEntities = (text) => {
  if (typeof text !== "string") return text;

  const htmlEntities = {
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

  return text.replace(/&[#\w]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
};

export const transformJsonLdToRecipe = (jsonLdRecipe, sourceUrl) => {
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
  let recipe_yield = 1;
  if (recipe.recipe_yield) {
    if (Array.isArray(recipe.recipe_yield)) {
      // Try to extract number from first yield item
      const firstYield = recipe.recipe_yield[0];
      if (typeof firstYield === "string") {
        const match = firstYield.match(/(\d+)/);
        if (match) {
          recipe_yield = parseInt(match[1], 10);
        }
      } else if (typeof firstYield === "number") {
        recipe_yield = firstYield;
      }
    } else if (typeof recipe.recipe_yield === "string") {
      const match = recipe.recipe_yield.match(/(\d+)/);
      if (match) {
        recipe_yield = parseInt(match[1], 10);
      }
    } else if (typeof recipe.recipe_yield === "number") {
      recipe_yield = recipe.recipe_yield;
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
  const parseDuration = (duration) => {
    if (!duration) return "PT0M";

    // If already in ISO 8601 format, return as is
    if (duration.startsWith("PT")) return duration;

    // Convert various formats to ISO 8601
    // Handle both "12m" and "12 m" formats
    const hourMatch = duration.match(/(\d+)\s*h/i) || duration.match(/(\d+)h/i);
    const minuteMatch =
      duration.match(/(\d+)\s*m/i) || duration.match(/(\d+)m/i);
    const secondMatch =
      duration.match(/(\d+)\s*s/i) || duration.match(/(\d+)s/i);

    let result = "PT";
    if (hourMatch) result += `${hourMatch[1]}H`;
    if (minuteMatch) result += `${minuteMatch[1]}M`;
    if (secondMatch) result += `${secondMatch[1]}S`;

    return result === "PT" ? "PT0M" : result;
  };

  const prep_time =
    parseDuration(recipe.prep_time || recipe.prepTime) || "PT0M";
  const cook_time =
    parseDuration(recipe.cook_time || recipe.cookTime) || "PT0M";
  const total_time =
    parseDuration(recipe.total_time || recipe.totalTime) || "PT0M";

  // Handle ingredients - convert to IngredientLine format with better parsing
  const ingredients = [];
  // Check for both new format and JSON-LD format
  const ingredientSource = recipe.ingredients || recipe.recipeIngredient;
  if (ingredientSource && Array.isArray(ingredientSource)) {
    ingredientSource.forEach((ingredient) => {
      if (typeof ingredient === "string") {
        ingredients.push({ raw: decodeHtmlEntities(ingredient) });
      } else if (ingredient && typeof ingredient === "object") {
        // Handle structured ingredients
        if (ingredient.text) {
          ingredients.push({ raw: decodeHtmlEntities(ingredient.text) });
        } else if (ingredient.name) {
          ingredients.push({ raw: decodeHtmlEntities(ingredient.name) });
        }
      }
    });
  }

  // Handle instructions - convert to RecipeInstruction format with better parsing
  const instructions = [];
  // Check for both new format and JSON-LD format
  const instructionSource = recipe.instructions || recipe.recipeInstructions;
  if (instructionSource && Array.isArray(instructionSource)) {
    instructionSource.forEach((instruction) => {
      if (instruction && typeof instruction === "object") {
        if (instruction.text) {
          instructions.push({ text: decodeHtmlEntities(instruction.text) });
        } else if (instruction.name) {
          instructions.push({ text: decodeHtmlEntities(instruction.name) });
        } else if (instruction.description) {
          instructions.push({
            text: decodeHtmlEntities(instruction.description),
          });
        }
      } else if (typeof instruction === "string") {
        instructions.push({ text: decodeHtmlEntities(instruction) });
      }
    });
  }

  const transformedRecipe = {
    title,
    recipe_yield,
    recipe_category,
    description,
    prep_time,
    cook_time,
    total_time,
    ingredients,
    instructions,
    source_url: sourceUrl || "",
  };

  console.log(
    "Final transformed recipe:",
    JSON.stringify(transformedRecipe, null, 2)
  );
  return transformedRecipe;
};
