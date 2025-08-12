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

    const prompt = `You are a recipe ingredient list extractor. You are given a list of text nodes with depth levels. Extract the nodes that are ingredients of the recipe.

Text content:
${structuredContent}

Instructions: 
- Extract ALL ingredients from the recipe
- All ingredients must have the same depth
- Once you find ingredients, include all sibling nodes of the same depth
- Dont stop after finding a few ingredients, traverse ALL siblings of the same depth



Ingredients (one per line):`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:0.5b",
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
