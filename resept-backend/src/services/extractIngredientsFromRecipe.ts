import { TextNode } from "../utils/cleanHTML";

interface IngredientsResult {
  success: boolean;
  error: string | null;
  ingredients: string[];
}

export const extractIngredientsFromRecipe = async (
  textNodes: TextNode[]
): Promise<IngredientsResult> => {
  try {
    // Convert text nodes to a structured string format for LLM processing
    const structuredContent = textNodes
      .map((node) => `${"  ".repeat(node.depth)}${node.text}`)
      .join("\n");

    const prompt = `You are a recipe ingredient extractor. Extract ONLY the ingredient lines from this recipe text.

Text content:
${structuredContent}

Rules for identifying ingredients:
- Ingredients are typically food items, measurements, or cooking instructions
- They often start with numbers, fractions, or measurement words (1 cup, 2 tbsp, 1/2 tsp)
- Common ingredient words: flour, sugar, salt, eggs, milk, butter, oil, spices, herbs
- Only identify, dont translate, paraphrase, or change the text in any way.

Return ONLY the ingredient lines, one per line, with no additional text:`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:3b",
        prompt,
        stream: false,
        options: {
          temperature: 0,
          num_predict: 500,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "Ollama API not found. Please ensure Ollama is running on localhost:11434"
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const ingredientsText = data.response?.trim();

    if (!ingredientsText || ingredientsText.length < 2) {
      return {
        success: false,
        error: "No valid ingredients extracted",
        ingredients: [],
      };
    }

    if (ingredientsText === "NO_INGREDIENTS_FOUND") {
      return {
        success: false,
        error: "No ingredients found in the HTML content",
        ingredients: [],
      };
    }

    // Split the response by newlines and filter out empty lines
    const ingredients = ingredientsText
      .split("\n")
      .map((ingredient: string) => ingredient.trim())
      .filter((ingredient: string) => ingredient.length > 0);

    if (ingredients.length === 0) {
      return {
        success: false,
        error: "No valid ingredients found after parsing",
        ingredients: [],
      };
    }

    return {
      success: true,
      error: null,
      ingredients,
    };
  } catch (error: any) {
    console.error("Error in extractIngredientsFromRecipe:", error);
    return {
      success: false,
      error: error.message || "Failed to extract ingredients",
      ingredients: [],
    };
  }
};
