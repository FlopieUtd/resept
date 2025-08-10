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
  const name = recipe.name || recipe.headline || "Untitled Recipe";
  const description = recipe.description || recipe.about || "";

  // Handle recipeYield - could be string or array
  let recipeYield = 1;
  if (recipe.recipeYield) {
    if (Array.isArray(recipe.recipeYield)) {
      // Try to extract number from first yield item
      const firstYield = recipe.recipeYield[0];
      if (typeof firstYield === "string") {
        const match = firstYield.match(/(\d+)/);
        if (match) {
          recipeYield = parseInt(match[1], 10);
        }
      } else if (typeof firstYield === "number") {
        recipeYield = firstYield;
      }
    } else if (typeof recipe.recipeYield === "string") {
      const match = recipe.recipeYield.match(/(\d+)/);
      if (match) {
        recipeYield = parseInt(match[1], 10);
      }
    } else if (typeof recipe.recipeYield === "number") {
      recipeYield = recipe.recipeYield;
    }
  }

  // Handle recipeCategory - could be string or array
  let recipeCategory = "Recepten";
  if (recipe.recipeCategory) {
    if (Array.isArray(recipe.recipeCategory)) {
      recipeCategory = recipe.recipeCategory[0] || "Recepten";
    } else {
      recipeCategory = recipe.recipeCategory;
    }
  }

  // Handle times - convert ISO 8601 duration to readable format
  const formatDuration = (duration) => {
    if (!duration) return "";

    // Simple conversion from PT format (e.g., PT5M -> 5 min)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const seconds = match[3] ? parseInt(match[3], 10) : 0;

      // Convert total minutes to hours and remaining minutes
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes >= 60) {
        const displayHours = Math.floor(totalMinutes / 60);
        const displayMinutes = totalMinutes % 60;
        const result = `${displayHours}u`;
        if (displayMinutes > 0) {
          return `${result} ${displayMinutes}m`;
        } else if (seconds > 0) {
          return `${result} ${seconds}s`;
        }
        return result;
      } else if (totalMinutes > 0) {
        return `${totalMinutes}m`;
      } else if (seconds > 0) {
        return `${seconds}s`;
      }
    }
    return duration;
  };

  const prepTime = formatDuration(recipe.prepTime) || "";
  const cookTime = formatDuration(recipe.cookTime) || "";
  const totalTime = formatDuration(recipe.totalTime) || "";

  // Handle recipeIngredients - convert to IngredientLine format with better parsing
  const recipeIngredients = [];
  if (recipe.recipeIngredient && Array.isArray(recipe.recipeIngredient)) {
    recipe.recipeIngredient.forEach((ingredient) => {
      if (typeof ingredient === "string") {
        recipeIngredients.push({ raw: ingredient });
      } else if (ingredient && typeof ingredient === "object") {
        // Handle structured ingredients
        if (ingredient.text) {
          recipeIngredients.push({ raw: ingredient.text });
        } else if (ingredient.name) {
          recipeIngredients.push({ raw: ingredient.name });
        }
      }
    });
  }

  // Handle recipeInstructions - convert to RecipeInstruction format with better parsing
  const recipeInstructions = [];
  if (recipe.recipeInstructions && Array.isArray(recipe.recipeInstructions)) {
    recipe.recipeInstructions.forEach((instruction) => {
      if (instruction && typeof instruction === "object") {
        if (instruction.text) {
          recipeInstructions.push({ text: instruction.text });
        } else if (instruction.name) {
          recipeInstructions.push({ text: instruction.name });
        } else if (instruction.description) {
          recipeInstructions.push({ text: instruction.description });
        }
      } else if (typeof instruction === "string") {
        recipeInstructions.push({ text: instruction });
      }
    });
  }

  const transformedRecipe = {
    name,
    recipeYield,
    recipeCategory,
    description,
    prepTime,
    cookTime,
    totalTime,
    recipeIngredients,
    recipeInstructions,
    sourceUrl: sourceUrl || "",
  };

  console.log(
    "Final transformed recipe:",
    JSON.stringify(transformedRecipe, null, 2)
  );
  return transformedRecipe;
};
