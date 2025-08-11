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
    source: string;
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

    console.log("LLM: Extracting recipe from clean HTML...");
    console.log(`LLM: Using model: ${modelName}`);
    console.log(`LLM: HTML length: ${cleanHtml.length} characters`);
    console.log(`LLM: Source URL: ${sourceUrl}`);

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
        temperature: 0.1, // Low temperature for consistent output
        num_predict: 1000, // Limit response length
      },
    });

    const executionTime = Date.now() - startTime;
    console.log(`LLM: Received response from Ollama in ${executionTime}ms`);

    // Extract the content from the response
    const llmResponse = response.message.content;

    // Try to parse the JSON response
    try {
      // Find JSON in the response (sometimes LLMs add extra text)
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      let jsonString = jsonMatch[0];
      console.log("LLM: Initial JSON match length:", jsonString.length);
      let recipeData: any;

      console.log("LLM: Extracted JSON string length:", jsonString.length);

      // Try to fix common JSON issues
      try {
        // First attempt: direct parse
        recipeData = JSON.parse(jsonString);
        console.log("LLM: Successfully parsed recipe data on first attempt");
      } catch (firstError: any) {
        console.log(
          "LLM: First JSON parse failed, attempting to fix common issues..."
        );
        console.log("LLM: First error:", firstError.message);

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
          console.log(
            "LLM: Successfully parsed recipe data after fixing common issues"
          );
        } catch (secondError: any) {
          console.log("LLM: Second parse attempt failed:", secondError.message);
          console.log("LLM: Attempting to extract valid JSON portion...");

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
            console.log("LLM: Successfully parsed truncated JSON");
          } else {
            // Last resort: try to extract JSON from anywhere in the response
            console.log(
              "LLM: Truncation failed, attempting to find JSON anywhere in response..."
            );
            console.log("LLM: Raw response length:", llmResponse.length);
            console.log(
              "LLM: Raw response preview:",
              llmResponse.substring(0, 500)
            );

            // Look for JSON patterns in the entire response
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
              console.log(
                `LLM: Found valid JSON using pattern matching (type: ${
                  Array.isArray(largestValidJson) ? "array" : "object"
                }, size: ${bestMatch?.length || "unknown"} chars)`
              );
            }

            if (largestValidJson) {
              recipeData = largestValidJson;
              console.log(
                `LLM: Found valid JSON using pattern matching (size: ${largestSize} chars)`
              );
            }

            if (!recipeData) {
              throw new Error(
                "Could not extract valid JSON even after all attempts"
              );
            }
          }
        }
      }

      console.log("LLM: Successfully parsed recipe data");
      console.log(
        "LLM: Raw recipe data before validation:",
        JSON.stringify(recipeData, null, 2)
      );

      // Validate and transform the recipe data
      const recipe = validateAndTransformRecipe(recipeData, sourceUrl);
      console.log(
        "LLM: Recipe after validation:",
        JSON.stringify(recipe, null, 2)
      );

      const totalTime = Date.now() - startTime;
      console.log(
        `LLM: Recipe extraction completed successfully in ${totalTime}ms using model ${modelName}`
      );

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
      console.log("LLM: Raw response was:", llmResponse);

      return {
        success: false,
        error: `Failed to parse LLM response: ${parseError.message}`,
      };
    }
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(
      `LLM: Error calling Ollama after ${totalTime}ms using model ${modelName}:`,
      error
    );
    return {
      success: false,
      error: error.message || "Failed to extract recipe with LLM",
    };
  }
};

// Function to validate and transform the LLM response
const validateAndTransformRecipe = (recipeData: any, sourceUrl: string) => {
  console.log(
    "LLM: Validation function input:",
    JSON.stringify(recipeData, null, 2)
  );
  console.log("LLM: Available fields in recipeData:", Object.keys(recipeData));

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
    source: sourceUrl,
  };

  console.log(
    "LLM: Validation function output:",
    JSON.stringify(recipe, null, 2)
  );
  return recipe;
};

// Function to prepare the prompt for the LLM
const createLlmPrompt = (cleanHtml: string, sourceUrl: string): string => {
  return `You are a recipe extraction expert. Extract recipe information from the following HTML content and format it as a JSON object.

Source URL: ${sourceUrl}

HTML Content:
${cleanHtml}

Please extract and return a recipe in the following JSON format:
{
  "title": "Recipe title (e.g. 'Spaghetti met kokkels')",
  "recipe_yield": number of servings,
  "recipe_category": "Category (e.g., Hoofdgerecht, Dessert, Appetizer)",
  "description": "Brief description of the recipe",
  "prep_time": "ISO 8601 duration (e.g., PT15M for 15 minutes)",
  "cook_time": "ISO 8601 duration (e.g., PT30M for 30 minutes)", 
  "total_time": "ISO 8601 duration (e.g., PT45M for 45 minutes)",
  "ingredients": [
    {"raw": "ingredient text"}
  ],
  "instructions": [
    {"text": "instruction step"}
  ],
  "source_url": "source URL"
}

Rules:
1. Extract ALL fields - do not omit any fields
2. If a field is not found in the HTML, use null for that field
3. Ingredients should be extracted as individual items
4. Instructions should be extracted as sequential steps
5. All times should be in ISO 8601 format (PT1H30M for 1 hour 30 minutes)
6. Absolutely no translating or paraphrasing. Copy the ingredient and instruction from the HTML content as is.
7. Dutch html content in, dutch JSON out.
8. Return only the JSON object, no additional text.`;
};
