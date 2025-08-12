interface IngredientResult {
  success: boolean;
  error: string | null;
  ingredient: string | null;
}

export const extractFirstIngredientFromHtml = async (
  htmlContent: string
): Promise<IngredientResult> => {
  try {
    console.log(
      "HTML content being sent to LLM:",
      htmlContent.substring(0, 500)
    );

    const prompt = `You are a recipe ingredient extractor. Look at this HTML content and find the FIRST ingredient mentioned in the recipe. 

HTML content:
${htmlContent.substring(0, 1000)}

Instructions: 
- Extract ONLY the first ingredient name and quantity
- Do not add any explanations or extra text
- If no ingredient is found, respond with "NO_INGREDIENT_FOUND"
- The response should be just the ingredient name, nothing else

First ingredient:`;

    console.log("Prompt being sent to LLM:", prompt);

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
          num_predict: 100,
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
    console.log("LLM raw response:", data);

    const ingredient = data.response?.trim();

    if (!ingredient || ingredient.length < 2) {
      return {
        success: false,
        error: "No valid ingredient extracted",
        ingredient: null,
      };
    }

    if (ingredient === "NO_INGREDIENT_FOUND") {
      return {
        success: false,
        error: "No ingredient found in the HTML content",
        ingredient: null,
      };
    }

    console.log("Extracted ingredient:", ingredient);

    return {
      success: true,
      error: null,
      ingredient,
    };
  } catch (error: any) {
    console.error("Error in extractFirstIngredientFromHtml:", error);
    return {
      success: false,
      error: error.message || "Failed to extract ingredient",
      ingredient: null,
    };
  }
};
