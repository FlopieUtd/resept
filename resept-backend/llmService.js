// Parse JSON-LD directly to recipe format
const parseJsonLdToRecipe = (jsonLdContent, url) => {
  try {
    // Extract JSON from script tag
    const jsonMatch = jsonLdContent.match(/<script[^>]*>(.*?)<\/script>/s);
    if (!jsonMatch) return null;

    const jsonData = JSON.parse(jsonMatch[1]);

    // Handle @graph array or direct object
    let recipeData = null;
    if (jsonData["@graph"]) {
      recipeData = jsonData["@graph"].find(
        (item) =>
          item["@type"] === "Recipe" ||
          (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
      );
    } else if (
      jsonData["@type"] === "Recipe" ||
      (Array.isArray(jsonData["@type"]) && jsonData["@type"].includes("Recipe"))
    ) {
      recipeData = jsonData;
    }

    if (!recipeData) return null;

    // Convert to our desired format
    const recipe = {
      name: recipeData.name || "",
      recipeYield:
        typeof recipeData.recipeYield === "number"
          ? recipeData.recipeYield
          : typeof recipeData.recipeYield === "string"
          ? parseInt(recipeData.recipeYield) || 0
          : 0,
      recipeCategory: Array.isArray(recipeData.recipeCategory)
        ? recipeData.recipeCategory.join(", ")
        : recipeData.recipeCategory || "",
      description: recipeData.description || "",
      prepTime: recipeData.prepTime || "",
      cookTime: recipeData.cookTime || "",
      totalTime: recipeData.totalTime || "",
      recipeIngredients: (recipeData.recipeIngredient || []).map(
        (ingredient) => ({
          raw:
            typeof ingredient === "string"
              ? ingredient
              : ingredient.text || ingredient.name || "",
        })
      ),
      recipeInstructions: (recipeData.recipeInstructions || []).map(
        (instruction) => ({
          text:
            typeof instruction === "string"
              ? instruction
              : instruction.text || instruction.name || "",
        })
      ),
      sourceUrl: url,
    };

    return recipe;
  } catch (error) {
    console.log(`⚠️ Failed to parse JSON-LD: ${error.message}`);
    return null;
  }
};

// Parse ingredients using LLM to extract detailed information
export const parseIngredientsWithLlm = async (
  ingredients,
  modelName = "llama3.1:8b"
) => {
  if (!ingredients || ingredients.length === 0) return [];

  console.log(`🔧 Parsing ${ingredients.length} ingredients with LLM...`);
  console.log(
    `📝 Input ingredients:`,
    ingredients.map((ing) => (typeof ing === "string" ? ing : ing.raw))
  );

  const prompt = `Return a JSON array with exactly ${
    ingredients.length
  } objects. Each ingredient gets one object:

${ingredients
  .map((ing, i) => `${i + 1}. ${typeof ing === "string" ? ing : ing.raw}`)
  .join("\n")}

Format:
[
  {"raw": "original text", "name": "ingredient", "amount": null, "unit": null, "qualifier": null},
  {"raw": "original text", "name": "ingredient", "amount": null, "unit": null, "qualifier": null}
]

Array:`;

  const payload = {
    model: modelName,
    prompt,
    format: "json",
    keep_alive: "1h",
    options: {
      temperature: 0.1,
      num_predict: 1500,
      num_ctx: 3072,
    },
    stream: false,
  };

  try {
    const startTime = Date.now();
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    const parseTime = Date.now() - startTime;

    console.log(`🔍 Raw LLM response:`, result.response);

    let parsedIngredients = JSON.parse(result.response || "[]");

    // Ensure we always return an array
    if (!Array.isArray(parsedIngredients)) {
      console.log(
        `⚠️ LLM returned single object instead of array, wrapping it`
      );
      parsedIngredients = [parsedIngredients];
    }

    // Validate we have the right number of ingredients
    if (parsedIngredients.length !== ingredients.length) {
      console.log(
        `⚠️ Expected ${ingredients.length} ingredients, got ${parsedIngredients.length}`
      );
    }

    console.log(
      `✅ Parsed ${parsedIngredients.length} ingredients in ${parseTime}ms`
    );

    return parsedIngredients;
  } catch (error) {
    console.log(`❌ Failed to parse ingredients: ${error.message}`);
    // Fallback: return ingredients with just raw text
    return ingredients.map((ing) => ({
      raw: typeof ing === "string" ? ing : ing.raw || ing.text || "",
      name: null,
      amount: null,
      unit: null,
      qualifier: null,
    }));
  }
};

// Extract only recipe-relevant HTML sections
export const extractRelevantHtml = (html) => {
  console.log(
    `🔍 Starting HTML extraction from ${Math.round(
      html.length / 1024
    )}KB of HTML`
  );

  // Common recipe-related patterns to look for (more specific)
  const recipePatterns = [
    // Schema.org structured data (JSON-LD) - only if it contains recipe data
    {
      name: "JSON-LD Schema",
      pattern:
        /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>.*?<\/script>/gis,
    },
    // Very specific recipe class/id patterns
    {
      name: "Recipe Elements",
      pattern:
        /<[^>]*(?:class|id)=["'][^"']*(?:recipe-(?:card|content|ingredients|instructions)|ingredients?-list|instructions?-list|bereiding|ingredienten)[^"']*["'][^>]*>.*?<\/[^>]+>/gis,
    },
    // Paragraphs with recipe content (ingredients/steps with Dutch cooking terms)
    {
      name: "Recipe Paragraphs",
      pattern:
        /<p[^>]*>[^<]*(?:\d+\.?\s|aubergine|knoflook|olijfolie|chilipeper|tomaten|oregano|spaghetti|basilicum|verhit|snijd|rooster|voeg.*toe|kook|meng).*?<\/p>/gis,
    },
    // Article content that seems to be a recipe
    {
      name: "Recipe Articles",
      pattern:
        /<article[^>]*class=["'][^"']*post[^"']*["'][^>]*>.*?<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>.*?<\/article>/gis,
    },
  ];

  let relevantSections = [];
  let patternStats = {};

  // First, check for JSON-LD schema - if found, return immediately
  const jsonLdMatches = html.match(recipePatterns[0].pattern) || [];
  patternStats[recipePatterns[0].name] = jsonLdMatches.length;
  console.log(
    `  📋 ${recipePatterns[0].name}: found ${jsonLdMatches.length} sections`
  );

  if (jsonLdMatches.length > 0) {
    console.log(`🚀 JSON-LD schema found! Parsing directly to recipe format.`);
    const jsonLdContent = jsonLdMatches.join("\n");

    return {
      success: true,
      relevantHtml: jsonLdContent,
      originalSize: html.length,
      extractedSize: jsonLdContent.length,
      reductionPercent: Math.round(
        (1 - jsonLdContent.length / html.length) * 100
      ),
      sectionsFound: jsonLdMatches.length,
      patternStats,
      method: "json-ld",
      message: "Found structured JSON-LD recipe data",
    };
  }

  // If no JSON-LD found, continue with other patterns
  console.log(`⚠️ No JSON-LD schema found, extracting HTML content...`);

  // Extract sections matching remaining recipe patterns (skip first one, already checked)
  recipePatterns.slice(1).forEach(({ name, pattern }) => {
    const matches = html.match(pattern) || [];
    patternStats[name] = matches.length;
    relevantSections = relevantSections.concat(matches);
    console.log(`  📋 ${name}: found ${matches.length} sections`);
  });

  // Remove duplicates and combine
  const uniqueSections = [...new Set(relevantSections)];
  let combinedHtml = uniqueSections.join("\n");

  // Fast cleanup: Remove unwanted elements
  console.log(`🧹 Cleaning HTML...`);
  const cleanupStart = Date.now();

  // Remove scripts, styles, head content, and other noise
  combinedHtml = combinedHtml
    // First, preserve JSON-LD scripts temporarily
    .replace(
      /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis,
      "___JSON_LD_PLACEHOLDER___$1___JSON_LD_END___"
    )
    // Remove ALL script tags
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    // Restore JSON-LD scripts
    .replace(
      /___JSON_LD_PLACEHOLDER___(.*?)___JSON_LD_END___/gis,
      '<script type="application/ld+json">$1</script>'
    )
    // Remove all style tags
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    // Remove head section entirely
    .replace(/<head[^>]*>.*?<\/head>/gis, "")
    // Remove comments
    .replace(/<!--.*?-->/gs, "")
    // Remove nav, footer, header, aside elements
    .replace(
      /<(?:nav|footer|header|aside)[^>]*>.*?<\/(?:nav|footer|header|aside)>/gis,
      ""
    )
    // Remove cookie consent and other common website elements
    .replace(
      /<div[^>]*(?:class|id)=["'][^"']*(?:cookie|consent|banner|popup|modal|breadcrumb|navigation|sidebar|widget|advertisement)[^"']*["'][^>]*>.*?<\/div>/gis,
      ""
    )
    // Remove spans with meta information
    .replace(
      /<span[^>]*(?:class|id)=["'][^"']*(?:meta|tag|category|date)[^"']*["'][^>]*>.*?<\/span>/gis,
      ""
    )
    // Remove divs with controls, buttons, or related posts
    .replace(
      /<div[^>]*(?:class|id)=["'][^"']*(?:control|button|related|next|prev|tag)[^"']*["'][^>]*>.*?<\/div>/gis,
      ""
    )
    // Remove ul/li with non-recipe content
    .replace(
      /<ul[^>]*(?:class|id)=["'][^"']*(?:control|navigation|meta|social)[^"']*["'][^>]*>.*?<\/ul>/gis,
      ""
    )
    // Remove meta tags
    .replace(/<meta[^>]*\/?>/gi, "")
    // Remove link tags
    .replace(/<link[^>]*\/?>/gi, "")
    // Remove noscript tags
    .replace(/<noscript[^>]*>.*?<\/noscript>/gis, "")
    // Remove images that are not recipe-related
    .replace(
      /<img[^>]*(?:class|id)=["'][^"']*(?:logo|avatar|icon)[^"']*["'][^>]*\/?>/gi,
      ""
    )
    // Remove all SVG elements
    .replace(/<svg[^>]*>.*?<\/svg>/gis, "")
    // Clean up excessive whitespace
    .replace(/\s+/g, " ")
    .trim();

  const cleanupTime = Date.now() - cleanupStart;
  console.log(`🧹 Cleanup completed in ${cleanupTime}ms`);

  console.log(`📊 Extraction Results:`);
  console.log(`  - Original HTML: ${Math.round(html.length / 1024)}KB`);
  console.log(`  - Found ${uniqueSections.length} unique recipe sections`);
  console.log(
    `  - Before cleanup: ${Math.round(
      uniqueSections.join("\n").length / 1024
    )}KB`
  );
  console.log(`  - After cleanup: ${Math.round(combinedHtml.length / 1024)}KB`);
  console.log(
    `  - Total reduction: ${Math.round(
      (1 - combinedHtml.length / html.length) * 100
    )}%`
  );

  if (uniqueSections.length > 0) {
    return {
      success: true,
      relevantHtml: combinedHtml,
      originalSize: html.length,
      extractedSize: combinedHtml.length,
      reductionPercent: Math.round(
        (1 - combinedHtml.length / html.length) * 100
      ),
      sectionsFound: uniqueSections.length,
      patternStats,
    };
  } else {
    console.log(`⚠️ No specific recipe sections found, returning full HTML`);
    return {
      success: false,
      relevantHtml: html,
      originalSize: html.length,
      extractedSize: html.length,
      reductionPercent: 0,
      sectionsFound: 0,
      patternStats,
      fallback: true,
    };
  }
};

// Main extraction function that handles both JSON-LD and HTML
export const extractRecipeData = async (html, url, parseIngredients = true) => {
  console.log(`🔍 Starting recipe extraction for: ${url}`);

  // Try HTML extraction first
  const htmlResult = extractRelevantHtml(html);

  if (htmlResult.method === "json-ld") {
    // Parse JSON-LD directly to recipe format
    const recipe = parseJsonLdToRecipe(htmlResult.relevantHtml, url);

    if (recipe) {
      console.log(
        `✨ Successfully parsed JSON-LD recipe: "${recipe.name}" with ${recipe.recipeIngredients.length} ingredients`
      );

      // Optionally parse ingredients with LLM for detailed structure
      if (parseIngredients && recipe.recipeIngredients.length > 0 && false) {
        const startTime = Date.now();
        console.log(`🔧 Starting ingredient parsing...`);
        const parsedIngredients = await parseIngredientsWithLlm(
          recipe.recipeIngredients
        );
        const parseTime = Date.now() - startTime;
        console.log(`✅ Ingredient parsing completed in ${parseTime}ms`);
        recipe.recipeIngredients = parsedIngredients;
      }

      return {
        method: parseIngredients ? "json-ld-enhanced" : "json-ld-direct",
        recipe,
        timing: {
          parse: 0, // Direct parsing is essentially instant
          total: 0,
        },
      };
    } else {
      console.log(
        `⚠️ JSON-LD found but couldn't parse recipe data, falling back to raw HTML`
      );
      return {
        method: "json-ld-raw",
        htmlContent: htmlResult.relevantHtml,
        needsLlm: true,
      };
    }
  } else {
    // Return HTML content for LLM processing
    return {
      method: "html-extraction",
      htmlContent: htmlResult.relevantHtml,
      needsLlm: true,
      extractionStats: htmlResult,
    };
  }
};
