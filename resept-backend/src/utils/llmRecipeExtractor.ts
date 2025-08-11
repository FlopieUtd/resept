import { Ollama } from "ollama";

interface LlmRecipeExtractionRequest {
  cleanHtml: string;
  sourceUrl: string;
}

interface LlmRecipeExtractionResponse {
  success: boolean;
  error?: string;
  recipe?: {
    title: string;
    recipe_yield: number;
    recipe_category: string;
    description: string;
    prep_time: string;
    cook_time: string;
    total_time: string;
    ingredients: Array<{ raw: string }>;
    instructions: Array<{ text: string }>;
    source_url: string;
  };
}

const ollama = new Ollama({
  host: "http://localhost:11434",
});

const DEFAULT_MODEL = "qwen2.5:1.5b";

export const extractRecipeWithLlm = async (
  request: LlmRecipeExtractionRequest
): Promise<LlmRecipeExtractionResponse> => {
  const startTime = Date.now();
  const modelName = DEFAULT_MODEL;

  try {
    const { cleanHtml, sourceUrl } = request;

    // Create the prompt for the LLM
    const prompt = createLlmPrompt(cleanHtml, sourceUrl);

    // Call Ollama with the prompt
    const response = await ollama.chat({
      model: modelName,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      options: {
        temperature: 0.0, // Zero temperature for maximum determinism and accuracy
        num_predict: 1200, // Increased to ensure complete JSON
        top_k: 20, // Limit token selection for speed
      },
    });

    // Extract the content from the response
    const llmResponse = response.message.content;

    // Try to parse the JSON response
    try {
      // Find JSON in the response (sometimes LLMs add extra text)
      // Try to find the largest complete JSON object
      const jsonMatches = llmResponse.match(/\{[\s\S]*\}/g);
      if (!jsonMatches || jsonMatches.length === 0) {
        throw new Error("No JSON found in LLM response");
      }

      // Pick the largest JSON match (most complete recipe)
      let jsonString = jsonMatches.reduce((largest, current) =>
        current.length > largest.length ? current : largest
      );
      let recipeData: any;

      // Try to fix common JSON issues
      try {
        // First attempt: direct parse
        recipeData = JSON.parse(jsonString);
        // console.log("LLM: Successfully parsed recipe data on first attempt");
      } catch (firstError: any) {
        // Check if JSON is incomplete (missing closing braces)
        const openBraces = (jsonString.match(/\{/g) || []).length;
        let closeBraces = (jsonString.match(/\}/g) || []).length;
        const openBrackets = (jsonString.match(/\[/g) || []).length;
        let closeBrackets = (jsonString.match(/\]/g) || []).length;

        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          // Try to complete the JSON by adding missing closing characters
          while (openBraces > closeBraces) {
            jsonString += "}";
            closeBraces++;
          }
          while (openBrackets > closeBrackets) {
            jsonString += "]";
            closeBrackets++;
          }
        }

        // Fix common trailing comma issues
        jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

        // Fix trailing commas in arrays and objects
        jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");
        jsonString = jsonString.replace(/,(\s*})/g, "$1");

        // Fix missing quotes around property names
        jsonString = jsonString.replace(
          /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
          '$1"$2":'
        );

        // Fix unescaped quotes in strings
        jsonString = jsonString.replace(/(?<!\\)"/g, '\\"');
        jsonString = jsonString.replace(/\\"/g, '"');

        // Fix newlines and control characters in strings
        jsonString = jsonString
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");

        // Try parsing again
        try {
          recipeData = JSON.parse(jsonString);
        } catch (secondError: any) {
          // Try to find the largest valid JSON object
          let validJson = "";
          for (let i = jsonString.length; i > 0; i--) {
            try {
              const testJson = jsonString.substring(0, i);
              JSON.parse(testJson);
              validJson = testJson;
              break;
            } catch (e) {
              // Continue trying shorter strings
            }
          }

          if (validJson) {
            recipeData = JSON.parse(validJson);
          } else {
            const jsonPatterns = [
              /\{[\s\S]*\}/g, // Any JSON object (greedy)
              /\[[\s\S]*\]/g, // Any JSON array (greedy)
            ];

            // Try to find the largest valid JSON object, prioritizing objects over arrays
            let largestValidJson = null;
            let largestSize = 0;
            let bestMatch = null;

            for (const pattern of jsonPatterns) {
              const matches = llmResponse.match(pattern);
              if (matches) {
                for (const match of matches) {
                  try {
                    const parsed = JSON.parse(match);
                    if (parsed && typeof parsed === "object") {
                      // Prioritize objects over arrays, and prefer larger ones
                      const isObject = !Array.isArray(parsed);
                      const currentScore =
                        (isObject ? 1000000 : 0) + match.length;

                      if (currentScore > largestSize) {
                        largestValidJson = parsed;
                        largestSize = currentScore;
                        bestMatch = match;
                      }
                    }
                  } catch (e) {
                    // Continue to next match
                  }
                }
              }
            }

            if (largestValidJson) {
              recipeData = largestValidJson;
            }

            if (largestValidJson) {
              recipeData = largestValidJson;
            }

            if (!recipeData) {
              throw new Error(
                "Could not extract valid JSON even after all attempts"
              );
            }
          }
        }
      }

      // Validate and transform the recipe data
      const recipe = validateAndTransformRecipe(recipeData, sourceUrl);

      return {
        success: true,
        recipe,
      };
    } catch (parseError: any) {
      const totalTime = Date.now() - startTime;
      console.error(
        `LLM: Failed to parse JSON response after ${totalTime}ms:`,
        parseError
      );

      return {
        success: false,
        error: `Failed to parse LLM response: ${parseError.message}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to extract recipe with LLM",
    };
  }
};

// Function to validate and transform the LLM response
const validateAndTransformRecipe = (recipeData: any, sourceUrl: string) => {
  // Ensure all required fields exist with defaults
  const recipe = {
    title: recipeData.title || recipeData.name || "Untitled Recipe",
    recipe_yield:
      recipeData.recipe_yield || recipeData.yield || recipeData.servings || 1,
    recipe_category:
      recipeData.recipe_category || recipeData.category || "Main Course",
    description: recipeData.description || recipeData.desc || "",
    prep_time: recipeData.prep_time || recipeData.prep_time || "PT0M",
    cook_time: recipeData.cook_time || recipeData.cooking_time || "PT0M",
    total_time: recipeData.total_time || recipeData.total_time || "PT0M",
    ingredients: Array.isArray(recipeData.ingredients)
      ? recipeData.ingredients.map((ing: any) => ({
          raw:
            typeof ing === "string"
              ? ing
              : ing.raw || ing.text || ing.ingredient || "Unknown ingredient",
        }))
      : [],
    instructions: Array.isArray(recipeData.instructions)
      ? recipeData.instructions.map((inst: any) => ({
          text:
            typeof inst === "string"
              ? inst
              : inst.text ||
                inst.instruction ||
                inst.step ||
                "Unknown instruction",
        }))
      : [],
    source_url: sourceUrl,
  };

  return recipe;
};

// Function to prepare the prompt for the LLM
const createLlmPrompt = (cleanHtml: string, sourceUrl: string): string => {
  return `Extract recipe from HTML. Return ONLY this JSON format:

{
  "title": "Recipe title (e.g. 'Spaghetti carbonara')",
  "recipe_yield": number of servings,
  "recipe_category": "Category (e.g., Main dish, Dessert, Appetizer)",
  "description": "Brief description of the recipe",
  "prep_time": "ISO 8601 duration (e.g., PT15M for 15 minutes)",
  "cook_time": "ISO 8601 duration (e.g., PT30M for 30 minutes)", 
  "total_time": "ISO 8601 duration (e.g., PT45M for 45 minutes)",
  "ingredients": [
    {"raw": "ingredient text (e.g. '200g spaghetti')"}
  ],
  "instructions": [
    {"text": "instruction step"}
  ],
  "source_url": "${sourceUrl}"
}

Source: ${sourceUrl}
HTML: ${cleanHtml}

Rules:
1. All ingredients should be extracted as multiple individual items in an array
2. Instructions should be extracted as multiple sequential steps
3. Absolutely no translating or paraphrasing. Copy the ingredient and instruction from the HTML content as is.
4. Dutch html content in, dutch JSON out; english html content in, english JSON out.
5. ZERO CREATIVITY: You are forbidden from paraphrasing or rewriting. Only copy text exactly as it appears in the HTML. Any deviation from the source text is a failure. If text is not found, use null.`;
};
